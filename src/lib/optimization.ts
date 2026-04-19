import type {
  MaterialCombination,
  MaterialEntry,
  OptimizationResult,
  ProjectMaterial,
} from "@/types";

function dominates(
  a: { totalCost: number; totalCarbon: number },
  b: { totalCost: number; totalCarbon: number },
): boolean {
  const leC = a.totalCost <= b.totalCost;
  const leG = a.totalCarbon <= b.totalCarbon;
  const strictly = a.totalCost < b.totalCost || a.totalCarbon < b.totalCarbon;
  return leC && leG && strictly;
}

export function findParetoFrontier(
  combinations: MaterialCombination[],
): MaterialCombination[] {
  const pts = combinations.map((c) => ({
    c,
    cost: c.totalCost,
    carbon: c.totalCarbon,
  }));
  const frontier = pts.filter(
    (p) =>
      !pts.some(
        (q) =>
          q !== p &&
          dominates(
            { totalCost: q.cost, totalCarbon: q.carbon },
            { totalCost: p.cost, totalCarbon: p.carbon },
          ),
      ),
  );
  return frontier.map((p) => p.c).sort((a, b) => a.totalCost - b.totalCost);
}

export function checkFeasibility(
  c: { totalCost: number; totalCarbon: number },
  costCeiling: number,
  carbonBudget: number,
): boolean {
  return c.totalCost <= costCeiling && c.totalCarbon <= carbonBudget;
}

function weightedScore(costSavings: number, carbonSavings: number): number {
  const w = 0.5;
  return w * costSavings + w * carbonSavings;
}

export interface OptimizeInput {
  lineItems: Array<{
    material: MaterialEntry;
    quantity: number;
  }>;
  carbonBudget: number;
  costCeiling: number;
}

export function runOptimization(input: OptimizeInput): OptimizationResult {
  const { lineItems, carbonBudget, costCeiling } = input;
  const start = performance.now();

  if (lineItems.length === 0) {
    const empty: MaterialCombination = {
      id: "empty",
      selections: [],
      totalCost: 0,
      totalCarbon: 0,
      isFeasible: true,
      isOnParetoFrontier: true,
      costSavings: 0,
      carbonSavings: 0,
    };
    return {
      combinations: [empty],
      paretoFrontier: [empty],
      baseline: empty,
      feasibleCount: 1,
      totalCombinations: 1,
      executionTimeMs: performance.now() - start,
    };
  }

  const supplierCounts = lineItems.map((l) => l.material.suppliers.length);
  let totalCombinations = 1;
  for (const n of supplierCounts) totalCombinations *= n;

  const indices: number[] = lineItems.map(() => 0);

  function nextIndices(): boolean {
    for (let i = indices.length - 1; i >= 0; i--) {
      if (indices[i] < supplierCounts[i] - 1) {
        indices[i]++;
        for (let j = i + 1; j < indices.length; j++) indices[j] = 0;
        return true;
      }
    }
    return false;
  }

  const buildCombination = (idx: number[]): MaterialCombination => {
    const selections: MaterialCombination["selections"] = [];
    let totalCost = 0;
    let totalCarbon = 0;
    idx.forEach((supplierIndex, lineIdx) => {
      const { material, quantity } = lineItems[lineIdx];
      const s = material.suppliers[supplierIndex];
      const cost = quantity * s.unitPrice;
      const carbon = quantity * (s.estimatedCarbon?.value ?? s.embodiedCarbon);
      selections.push({
        materialId: material.id,
        supplierId: s.id,
        supplierName: s.name,
        quantity,
        cost,
        carbon,
      });
      totalCost += cost;
      totalCarbon += carbon;
    });
    return {
      id: idx.join("-"),
      selections,
      totalCost,
      totalCarbon,
      isFeasible: false,
      isOnParetoFrontier: false,
      costSavings: 0,
      carbonSavings: 0,
    };
  };

  const baselineIdx = lineItems.map(() => 0);
  const baseline = buildCombination(baselineIdx);
  const baselineCost = baseline.totalCost;
  const baselineCarbon = baseline.totalCarbon;

  const combinations: MaterialCombination[] = [];

  do {
    const c = buildCombination(indices);
    c.isFeasible = checkFeasibility(c, costCeiling, carbonBudget);
    c.costSavings = baselineCost - c.totalCost;
    c.carbonSavings = baselineCarbon - c.totalCarbon;
    combinations.push(c);
  } while (nextIndices());

  const paretoFrontier = findParetoFrontier(combinations);
  for (const c of combinations) {
    c.isOnParetoFrontier = paretoFrontier.some((p) => p.id === c.id);
  }

  const feasible = combinations.filter((c) => c.isFeasible);
  feasible.sort(
    (a, b) =>
      weightedScore(b.costSavings, b.carbonSavings) -
      weightedScore(a.costSavings, a.carbonSavings),
  );

  const executionTimeMs = performance.now() - start;

  let infeasibleReason: OptimizationResult["infeasibleReason"];
  if (feasible.length === 0 && combinations.length > 0) {
    const minCost = Math.min(...combinations.map((c) => c.totalCost));
    const minCarb = Math.min(...combinations.map((c) => c.totalCarbon));
    const costOk = minCost <= costCeiling;
    const carbOk = minCarb <= carbonBudget;
    if (!costOk && !carbOk) infeasibleReason = "both";
    else if (!costOk) infeasibleReason = "cost";
    else infeasibleReason = "carbon";
  }

  return {
    combinations,
    paretoFrontier,
    baseline,
    feasibleCount: feasible.length,
    totalCombinations,
    executionTimeMs,
    infeasibleReason,
  };
}

/** Cap stored/transmitted combinations so localStorage stays under quota. */
export const MAX_STORED_COMBINATIONS = 800;

/**
 * Keep feasible points, full Pareto frontier, then fill up to cap (for chart context).
 */
export function slimOptimizationResult(full: OptimizationResult): OptimizationResult {
  const byId = new Map<string, MaterialCombination>();

  for (const c of full.combinations) {
    if (c.isFeasible) byId.set(c.id, c);
  }
  for (const c of full.paretoFrontier) {
    byId.set(c.id, c);
  }

  if (byId.size < MAX_STORED_COMBINATIONS) {
    for (const c of full.combinations) {
      if (byId.size >= MAX_STORED_COMBINATIONS) break;
      if (!byId.has(c.id)) byId.set(c.id, c);
    }
  }

  const combinations = Array.from(byId.values());
  return {
    ...full,
    combinations,
    paretoFrontier: full.paretoFrontier,
    baseline: full.baseline,
  };
}

export function projectMaterialsToLineItems(
  materials: ProjectMaterial[],
  getMaterial: (id: string) => MaterialEntry | undefined,
): Array<{ material: MaterialEntry; quantity: number }> | { error: string } {
  const out: Array<{ material: MaterialEntry; quantity: number }> = [];
  for (const pm of materials) {
    const m = getMaterial(pm.materialId);
    if (!m) return { error: `Unknown material: ${pm.materialId}` };
    out.push({ material: m, quantity: pm.quantity });
  }
  return out;
}
