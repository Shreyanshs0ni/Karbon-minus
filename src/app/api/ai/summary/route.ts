import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatText } from "@/lib/openai";

const bodySchema = z.object({
  projectName: z.string(),
  carbonBudget: z.number(),
  costCeiling: z.number(),
  totalCost: z.number(),
  totalCarbon: z.number(),
  costSavings: z.number(),
  carbonSavings: z.number(),
  materialCount: z.number(),
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
  const p = parsed.data;

  const system = `Write a concise executive summary (2 short paragraphs) for procurement stakeholders about embodied carbon performance and budget. Plain text, no markdown.`;

  const user = `Project: ${p.projectName}\nBudget: ${p.carbonBudget} kgCO2e, ceiling ${p.costCeiling} INR\nTotals: cost ${p.totalCost}, carbon ${p.totalCarbon}\nSavings vs baseline: cost ${p.costSavings}, carbon ${p.carbonSavings}\nMaterials: ${p.materialCount}`;

  const ai = await chatText(system, user);
  if (ai.ok) {
    return NextResponse.json({ executiveSummary: ai.text });
  }

  return NextResponse.json({
    executiveSummary: `${p.projectName} balances procurement cost against embodied carbon. Totals are within the stated constraints where feasible; savings versus baseline selections are approximately ${Math.round(p.costSavings).toLocaleString()} INR on cost and ${Math.round(p.carbonSavings).toLocaleString()} kgCO2e on carbon across ${p.materialCount} tracked material lines.`,
    fallback: true,
  });
}
