import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllMaterials } from "@/lib/db";
import { chatJson } from "@/lib/openai";
import type { MaterialEntry } from "@/types";

const bodySchema = z.object({
  description: z.string().min(1),
  projectContext: z
    .object({
      existingMaterials: z.array(z.string()).optional(),
      category: z.string().optional(),
    })
    .optional(),
});

function keywordFallback(description: string, category?: string): string[] {
  const q = description.toLowerCase();
  const mats = getAllMaterials();
  const filtered = mats.filter((m) => {
    if (category && m.category !== category) return false;
    return (
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      q
        .split(/\s+/)
        .some((w) => w.length > 2 && m.name.toLowerCase().includes(w))
    );
  });
  return filtered.slice(0, 8).map((m) => m.id);
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { description, projectContext } = parsed.data;
  const all = getAllMaterials();
  const catalog = all.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    description: m.description,
  }));

  const system =
    'You map construction material descriptions to material IDs from the catalog. Respond with JSON only: {"matches":[{"materialId":"...","confidenceScore":0-1,"matchReason":"..."}],"suggestions":[]}. Sort matches by confidence descending. Use only IDs from the catalog.';

  const user = `Catalog:\n${JSON.stringify(
    catalog.slice(0, 80),
  )}\n\nDescription: ${description}\nExisting: ${
    projectContext?.existingMaterials?.join(", ") ?? ""
  }\nPreferred category: ${projectContext?.category ?? "any"}`;

  const ai = await chatJson<{
    matches: Array<{
      materialId: string;
      confidenceScore: number;
      matchReason: string;
    }>;
    suggestions?: string[];
  }>(system, user);

  const byId = new Map(all.map((m) => [m.id, m]));

  if (ai.ok) {
    const matches = ai.data.matches
      .filter((x) => byId.has(x.materialId))
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .map((x) => ({
        material: byId.get(x.materialId) as MaterialEntry,
        confidenceScore: x.confidenceScore,
        matchReason: x.matchReason,
      }));
    if (matches.length > 0) {
      return NextResponse.json({ matches, suggestions: ai.data.suggestions });
    }
  }

  const ids = keywordFallback(description, projectContext?.category);
  const fallbackMatches = ids.map((id, i) => ({
    material: byId.get(id) as MaterialEntry,
    confidenceScore: 0.35 - i * 0.02,
    matchReason: "Keyword match (AI unavailable or low confidence)",
  }));

  return NextResponse.json({
    matches: fallbackMatches,
    suggestions:
      fallbackMatches.length === 0
        ? ["Try browsing materials by category in the filter panel."]
        : [],
    fallback: true,
  });
}
