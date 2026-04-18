import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatJson } from "@/lib/openai";
import type { NegotiationBrief, ProjectMaterial } from "@/types";

const bodySchema = z.object({
  supplier: z.object({
    id: z.string(),
    name: z.string(),
  }),
  selectedMaterials: z.array(z.unknown()),
  competitorData: z.array(
    z.object({
      supplierName: z.string(),
      avgCarbonIntensity: z.number(),
      avgPrice: z.number(),
    }),
  ),
  priority: z.enum(["cost", "carbon", "balanced"]),
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
  const { supplier, selectedMaterials, competitorData, priority } = parsed.data;

  const system =
    'You are a procurement coach for embodied carbon in Indian construction. Output JSON only: {"talkingPoints":[],"carbonComparison":{"supplierCarbon":0,"categoryAverage":0,"percentile":0},"strategies":[],"volumeDiscountOpportunity":"","carbonImprovementSuggestions":[]}';

  const user = `Supplier: ${supplier.name} (${supplier.id})\nPriority: ${priority}\nMaterials: ${JSON.stringify(
    selectedMaterials,
  )}\nCompetitors: ${JSON.stringify(competitorData)}`;

  const ai = await chatJson<{
    talkingPoints: string[];
    carbonComparison: NegotiationBrief["carbonComparison"];
    strategies: string[];
    volumeDiscountOpportunity: string;
    carbonImprovementSuggestions: string[];
  }>(system, user);

  if (ai.ok) {
    const brief: NegotiationBrief = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      talkingPoints: ai.data.talkingPoints,
      carbonComparison: ai.data.carbonComparison,
      strategies: ai.data.strategies,
      volumeDiscountOpportunity: ai.data.volumeDiscountOpportunity,
      carbonImprovementSuggestions: ai.data.carbonImprovementSuggestions,
      priority,
    };
    return NextResponse.json({
      brief,
      generatedAt: new Date().toISOString(),
    });
  }

  const mats = selectedMaterials as ProjectMaterial[];
  const totalC = mats.reduce((a, m) => a + m.totalCarbon, 0);
  const totalQ = mats.reduce((a, m) => a + m.quantity, 0) || 1;

  const brief: NegotiationBrief = {
    supplierId: supplier.id,
    supplierName: supplier.name,
    talkingPoints: [
      `Request indexed pricing tied to raw material volatility for ${mats.length} line items.`,
      "Ask for EPD documentation or third-party verification for embodied carbon figures.",
      "Explore logistics consolidation to reduce transport emissions.",
    ],
    carbonComparison: {
      supplierCarbon: totalC / totalQ,
      categoryAverage:
        competitorData.length > 0
          ? competitorData.reduce((a, c) => a + c.avgCarbonIntensity, 0) /
            competitorData.length
          : totalC / totalQ,
      percentile: 50,
    },
    strategies: [
      "Anchor on competitor quotes and carbon intensity benchmarks.",
      "Offer longer tenure or phased releases for better unit economics.",
    ],
    volumeDiscountOpportunity:
      "Bundle releases across line items to unlock tiered discounts.",
    carbonImprovementSuggestions: [
      "Shift to lower-carbon cement blends where structurally approved.",
      "Commit to renewable energy share in manufacturing where available.",
    ],
    priority,
  };

  return NextResponse.json({
    brief,
    generatedAt: new Date().toISOString(),
    fallback: true,
  });
}
