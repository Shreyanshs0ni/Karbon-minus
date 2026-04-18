import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllMaterials, getMaterialById } from "@/lib/db";
import { chatJson } from "@/lib/openai";
import type { AlternativeSuggestion, ProjectMaterial } from "@/types";

const bodySchema = z.object({
  materials: z.array(z.unknown()),
});

function heuristicAlternatives(pm: ProjectMaterial): AlternativeSuggestion[] {
  const current = getMaterialById(pm.materialId);
  if (!current) return [];
  const peers = getAllMaterials()
    .filter((m) => m.category === current.category && m.id !== current.id)
    .map((alt) => {
      const best = [...alt.suppliers].sort(
        (a, b) =>
          (a.estimatedCarbon?.value ?? a.embodiedCarbon) -
          (b.estimatedCarbon?.value ?? b.embodiedCarbon),
      )[0];
      const curSup =
        current.suppliers.find((s) => s.id === pm.selectedSupplierId) ??
        current.suppliers[0];
      const altCarbon = best.estimatedCarbon?.value ?? best.embodiedCarbon;
      const curCarbon = pm.embodiedCarbon;
      const carbonSavings = (curCarbon - altCarbon) * pm.quantity;
      const carbonSavingsPercent =
        curCarbon > 0 ? (100 * (curCarbon - altCarbon)) / curCarbon : 0;
      const costDiff =
        pm.quantity * best.unitPrice - pm.quantity * curSup.unitPrice;
      const costDiffPercent =
        pm.totalCost > 0 ? (100 * costDiff) / pm.totalCost : 0;
      return {
        currentMaterial: pm,
        alternative: alt,
        alternativeSupplier: best,
        carbonSavings,
        carbonSavingsPercent,
        costDifference: costDiff,
        costDifferencePercent: costDiffPercent,
        explanation: `Lower-carbon option in the same category: ${alt.name} via ${best.name}.`,
      };
    })
    .filter((x) => x.carbonSavings > 0)
    .sort((a, b) => {
      const aGood = a.costDifference <= 0 ? 1 : 0;
      const bGood = b.costDifference <= 0 ? 1 : 0;
      if (aGood !== bGood) return bGood - aGood;
      return b.carbonSavings - a.carbonSavings;
    });

  return peers.slice(0, 5);
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
  const materials = parsed.data.materials as ProjectMaterial[];

  const system = `Given project materials, suggest lower-carbon alternatives from the same categories. JSON: {"suggestions":[{"materialIdToReplace":string,"alternativeMaterialId":string,"alternativeSupplierId":string,"explanation":string}]}`;

  const catalog = getAllMaterials().map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
  }));

  const user = `Materials: ${JSON.stringify(
    materials.map((m) => ({
      id: m.materialId,
      q: m.quantity,
      supplier: m.supplierName,
    })),
  )}\nCatalog sample: ${JSON.stringify(catalog.slice(0, 40))}`;

  const ai = await chatJson<{
    suggestions: Array<{
      materialIdToReplace: string;
      alternativeMaterialId: string;
      alternativeSupplierId: string;
      explanation: string;
    }>;
  }>(system, user);

  const out: AlternativeSuggestion[] = [];

  if (ai.ok) {
    for (const s of ai.data.suggestions) {
      const pm = materials.find((m) => m.materialId === s.materialIdToReplace);
      const alt = getMaterialById(s.alternativeMaterialId);
      const sup = alt?.suppliers.find((x) => x.id === s.alternativeSupplierId);
      if (!pm || !alt || !sup) continue;
      const altCarbon = sup.estimatedCarbon?.value ?? sup.embodiedCarbon;
      const curCarbon = pm.embodiedCarbon;
      const carbonSavings = (curCarbon - altCarbon) * pm.quantity;
      const carbonSavingsPercent =
        curCarbon > 0 ? (100 * (curCarbon - altCarbon)) / curCarbon : 0;
      const curSup =
        getMaterialById(pm.materialId)?.suppliers.find(
          (x) => x.id === pm.selectedSupplierId,
        ) ?? getMaterialById(pm.materialId)?.suppliers[0];
      const costDiff =
        pm.quantity * sup.unitPrice -
        pm.quantity * (curSup?.unitPrice ?? pm.unitPrice);
      out.push({
        currentMaterial: pm,
        alternative: alt,
        alternativeSupplier: sup,
        carbonSavings,
        carbonSavingsPercent,
        costDifference: costDiff,
        costDifferencePercent:
          pm.totalCost > 0 ? (100 * costDiff) / pm.totalCost : 0,
        explanation: s.explanation,
      });
    }
  }

  if (out.length === 0) {
    for (const pm of materials) {
      out.push(...heuristicAlternatives(pm));
    }
  }

  out.sort((a, b) => {
    const aGood = a.costDifference <= 0 && a.carbonSavings > 0 ? 1 : 0;
    const bGood = b.costDifference <= 0 && b.carbonSavings > 0 ? 1 : 0;
    if (aGood !== bGood) return bGood - aGood;
    return b.carbonSavings - a.carbonSavings;
  });

  return NextResponse.json({ suggestions: out.slice(0, 20) });
}
