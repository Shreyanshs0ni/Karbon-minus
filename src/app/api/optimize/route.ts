import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMaterialById } from "@/lib/db";
import {
  projectMaterialsToLineItems,
  runOptimization,
  slimOptimizationResult,
} from "@/lib/optimization";
import type { ProjectMaterial } from "@/types";

const bodySchema = z.object({
  materials: z.array(
    z.object({
      materialId: z.string(),
      quantity: z.number().positive(),
    }),
  ),
  carbonBudget: z.number().positive(),
  costCeiling: z.number().positive(),
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
  const { materials, carbonBudget, costCeiling } = parsed.data;

  const pms: ProjectMaterial[] = [];
  for (const m of materials) {
    const mat = getMaterialById(m.materialId);
    if (!mat) {
      return NextResponse.json(
        { error: "Material not found", materialId: m.materialId },
        { status: 404 },
      );
    }
    const s0 = mat.suppliers[0];
    const carbon = s0.estimatedCarbon?.value ?? s0.embodiedCarbon;
    pms.push({
      id: `tmp-${m.materialId}`,
      materialId: m.materialId,
      materialName: mat.name,
      category: mat.category,
      selectedSupplierId: s0.id,
      supplierName: s0.name,
      quantity: m.quantity,
      unit: mat.unit,
      unitPrice: s0.unitPrice,
      embodiedCarbon: carbon,
      isEstimated: !s0.hasEPD,
      totalCost: m.quantity * s0.unitPrice,
      totalCarbon: m.quantity * carbon,
    });
  }

  const lineItems = projectMaterialsToLineItems(pms, getMaterialById);
  if ("error" in lineItems) {
    return NextResponse.json({ error: lineItems.error }, { status: 400 });
  }

  const full = runOptimization({
    lineItems,
    carbonBudget,
    costCeiling,
  });
  const result = slimOptimizationResult(full);

  return NextResponse.json({
    combinations: result.combinations,
    paretoFrontier: result.paretoFrontier,
    baseline: result.baseline,
    feasibleCount: result.feasibleCount,
    totalCombinations: result.totalCombinations,
    executionTimeMs: result.executionTimeMs,
    infeasibleReason: result.infeasibleReason,
  });
}
