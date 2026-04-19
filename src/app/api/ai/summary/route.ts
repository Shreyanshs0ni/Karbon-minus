import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatText } from "@/lib/openai";

const bodySchema = z.object({
  projectName: z.string(),
  carbonBudget: z.number(),
  costCeiling: z.number(),
  baselineCost: z.number(),
  baselineCarbon: z.number(),
  currentCost: z.number(),
  currentCarbon: z.number(),
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

  const system = `You write a short executive summary (2 paragraphs, plain text, no markdown) for construction procurement stakeholders about embodied carbon and cost.

Rules:
- If carbon savings or cost savings versus baseline are clearly positive, open with that win and name approximate magnitudes.
- If baseline and current are nearly the same, say the project is aligned with the creation baseline and mention next steps (supplier mix, materials page) without sounding negative.
- Never claim no progress was made when savings numbers are positive.
- Reference budgets only as context (carbon budget and cost ceiling); do not say totals "failed" if they are within limits.`;

  const user = `Project: ${p.projectName}
Carbon budget: ${p.carbonBudget} kgCO2e · Cost ceiling: ${p.costCeiling} INR

Baseline at project creation — cost ${p.baselineCost} INR, embodied carbon ${p.baselineCarbon} kgCO2e
Current shortlist — cost ${p.currentCost} INR, embodied carbon ${p.currentCarbon} kgCO2e
Savings vs baseline — cost ${p.costSavings} INR, carbon ${p.carbonSavings} kgCO2e
Material line items: ${p.materialCount}`;

  const ai = await chatText(system, user);
  if (ai.ok) {
    return NextResponse.json({ executiveSummary: ai.text });
  }

  const costDown = p.costSavings > 1;
  const carbDown = p.carbonSavings > 1;
  let lead = `${p.projectName} tracks embodied carbon against a carbon budget of ${p.carbonBudget.toLocaleString()} kgCO2e and a cost ceiling of ${p.costCeiling.toLocaleString()} INR. `;
  if (costDown || carbDown) {
    lead += "Compared to the baseline at project creation, ";
    if (costDown) lead += `cost is about ${Math.round(p.costSavings).toLocaleString()} INR lower. `;
    if (carbDown)
      lead += `Embodied carbon is about ${Math.round(p.carbonSavings).toLocaleString()} kgCO2e lower. `;
  } else {
    lead += `Current totals (${Math.round(p.currentCost).toLocaleString()} INR, ${Math.round(p.currentCarbon).toLocaleString()} kgCO2e) are in line with the creation baseline; further gains may come from supplier mix and lower-carbon materials. `;
  }
  lead += `Across ${p.materialCount} material lines, use this report to brief procurement and suppliers.`;

  return NextResponse.json({
    executiveSummary: lead,
    fallback: true,
  });
}
