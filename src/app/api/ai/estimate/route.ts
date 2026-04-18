import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllMaterials } from "@/lib/db";
import { chatJson } from "@/lib/openai";

const bodySchema = z.object({
  materialName: z.string(),
  category: z.string(),
  supplierRegion: z.string(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { materialName, category, supplierRegion } = parsed.data;

  const similar = getAllMaterials()
    .filter((m) => m.category === category)
    .slice(0, 12);

  const refs = similar.flatMap((m) =>
    m.suppliers.slice(0, 2).map((s) => ({
      name: m.name,
      carbon: s.estimatedCarbon?.value ?? s.embodiedCarbon,
    })),
  );

  const system = `Estimate embodied carbon (kgCO2e per declared functional unit) for Indian construction products. JSON only: {"estimatedCarbon":number,"confidence":"high"|"medium"|"low","referenceMaterials":[{"name":string,"carbon":number}],"methodology":string}`;

  const user = `Product: ${materialName}\nCategory: ${category}\nRegion: ${supplierRegion}\nReference peers: ${JSON.stringify(refs)}`;

  const ai = await chatJson<{
    estimatedCarbon: number;
    confidence: "high" | "medium" | "low";
    referenceMaterials: Array<{ name: string; carbon: number }>;
    methodology: string;
  }>(system, user);

  if (ai.ok) {
    return NextResponse.json({
      estimatedCarbon: ai.data.estimatedCarbon,
      confidence: ai.data.confidence,
      referenceMaterials: ai.data.referenceMaterials,
      methodology: ai.data.methodology,
    });
  }

  const avg =
    refs.length > 0 ? refs.reduce((a, b) => a + b.carbon, 0) / refs.length : 1;
  return NextResponse.json({
    estimatedCarbon: Math.round(avg * 1000) / 1000,
    confidence: "medium" as const,
    referenceMaterials: refs.slice(0, 5),
    methodology:
      "Averaged similar materials in category (AI unavailable). Estimates are indicative.",
    fallback: true,
  });
}
