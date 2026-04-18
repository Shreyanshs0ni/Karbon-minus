"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { ParetoChart } from "@/components/optimization/ParetoChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { formatInr, formatKgCo2e } from "@/lib/utils";
import type { NegotiationBrief, OptimizationResult } from "@/types";

export default function OptimizePage() {
  const params = useParams();
  const id = params.id as string;
  const {
    project,
    materials,
    loadProject,
    optimizationResult,
    setOptimizationResult,
    selectedCombination,
    selectCombination,
  } = useProject();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<"cost" | "carbon" | "balanced">(
    "balanced",
  );
  const [brief, setBrief] = useState<NegotiationBrief | null>(null);
  const [briefSupplier, setBriefSupplier] = useState<string | null>(null);

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  async function run() {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materials: materials.map((m) => ({
            materialId: m.materialId,
            quantity: m.quantity,
          })),
          carbonBudget: project.carbonBudget,
          costCeiling: project.costCeiling,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error ?? "Optimization failed");
        return;
      }
      const data = await res.json();
      const result: OptimizationResult = {
        combinations: data.combinations,
        paretoFrontier: data.paretoFrontier,
        baseline: data.baseline,
        feasibleCount: data.feasibleCount,
        totalCombinations: data.totalCombinations,
        executionTimeMs: data.executionTimeMs,
        infeasibleReason: data.infeasibleReason,
      };
      setOptimizationResult(result);
    } finally {
      setLoading(false);
    }
  }

  async function genBrief(supplierName: string, supplierId: string) {
    if (!selectedCombination) return;
    setBriefSupplier(supplierId);
    const res = await fetch("/api/ai/negotiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier: { id: supplierId, name: supplierName },
        selectedMaterials: materials,
        competitorData: [
          { supplierName: "Market avg", avgCarbonIntensity: 1, avgPrice: 1 },
        ],
        priority,
      }),
    });
    const data = await res.json();
    setBrief(data.brief ?? null);
  }

  if (!project || project.id !== id) {
    return (
      <>
        <Nav projectId={id} />
        <main className="mx-auto max-w-5xl px-4 py-10">Loading…</main>
      </>
    );
  }

  return (
    <>
      <Nav projectId={id} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href={`/project/${id}`}
          className="text-sm text-accent hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Optimization
        </h1>
        <p className="mt-1 text-muted">
          Enumerate supplier mixes and explore the Pareto frontier.
        </p>

        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-4 text-foreground">
            <Button
              type="button"
              disabled={loading || materials.length === 0}
              onClick={() => void run()}
            >
              {loading ? "Running…" : "Run optimization"}
            </Button>
            {optimizationResult && (
              <span className="text-sm text-muted">
                {optimizationResult.totalCombinations} combinations ·{" "}
                {optimizationResult.executionTimeMs.toFixed(0)} ms · Feasible:{" "}
                {optimizationResult.feasibleCount}
              </span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          {optimizationResult?.infeasibleReason && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              No feasible combination under both constraints. Closest options
              shown; tightest limit: {optimizationResult.infeasibleReason}.
            </p>
          )}
        </Card>

        {optimizationResult && (
          <Card className="mt-6">
            <h2 className="text-lg font-medium text-foreground">
              Cost vs carbon
            </h2>
            <ParetoChart
              combinations={optimizationResult.combinations}
              paretoFrontier={optimizationResult.paretoFrontier}
              carbonBudget={project.carbonBudget}
              costCeiling={project.costCeiling}
              selectedCombination={selectedCombination}
              onSelectCombination={selectCombination}
            />
            {selectedCombination && (
              <div className="mt-4 rounded border border-border p-4 text-sm text-foreground">
                <div className="font-medium">Selected shortlist</div>
                <div className="mt-2">
                  {formatInr(selectedCombination.totalCost)} ·{" "}
                  {formatKgCo2e(selectedCombination.totalCarbon)}
                </div>
                <ul className="mt-2 list-inside list-disc text-muted">
                  {selectedCombination.selections.map((s) => (
                    <li key={`${s.materialId}-${s.supplierId}`}>
                      {s.materialId}: {s.supplierName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {selectedCombination && (
          <Card className="mt-6">
            <h2 className="text-lg font-medium text-foreground">
              Negotiation brief
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["cost", "carbon", "balanced"] as const).map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? "primary" : "secondary"}
                  type="button"
                  onClick={() => setPriority(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {Array.from(
                new Map(
                  selectedCombination.selections.map((s) => [
                    s.supplierId,
                    s.supplierName,
                  ]),
                ).entries(),
              ).map(([sid, name]) => (
                <div key={sid} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-foreground">{name}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={briefSupplier === sid}
                    onClick={() => void genBrief(name, sid)}
                  >
                    Generate brief
                  </Button>
                </div>
              ))}
            </div>
            {brief && (
              <div className="mt-4 space-y-3 text-sm text-foreground">
                <h3 className="font-medium">{brief.supplierName}</h3>
                <ul className="list-inside list-disc text-muted">
                  {brief.talkingPoints.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <p className="text-muted">{brief.volumeDiscountOpportunity}</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      [
                        ...brief.talkingPoints,
                        ...brief.strategies,
                        ...brief.carbonImprovementSuggestions,
                      ].join("\n"),
                    )
                  }
                >
                  Copy brief
                </Button>
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  );
}
