"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { ParetoChart } from "@/components/optimization/ParetoChart";
import { Button } from "@/components/ui/Button";
import { useProject } from "@/context/ProjectContext";
import { notifyError, notifySuccess } from "@/lib/toast";
import { cn, formatInr, formatKgCo2e } from "@/lib/utils";
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
    applySelectedCombinationToMaterials,
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

  function labelForMaterial(materialId: string): string {
    const line = materials.find((m) => m.materialId === materialId);
    return line?.materialName ?? materialId;
  }

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
        const msg = e.error ?? "Optimization failed";
        setError(msg);
        notifyError("Optimization failed", msg);
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
      notifySuccess(
        "Done — here are your options",
        `${result.feasibleCount} plans fit your budget and carbon limits.`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function genBrief(supplierName: string, supplierId: string) {
    if (!selectedCombination) return;
    setBriefSupplier(supplierId);
    try {
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
      if (!res.ok) throw new Error("Could not generate brief");
      const data = await res.json();
      setBrief(data.brief ?? null);
      notifySuccess(
        "Brief ready",
        `Talking points for ${supplierName} are below.`,
      );
    } catch {
      notifyError("Could not generate brief", "Please try again.");
    } finally {
      setBriefSupplier(null);
    }
  }

  if (!project || project.id !== id) {
    return (
      <>
        <Nav projectId={id} />
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-muted">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav projectId={id} />
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <div className="page-shell">
          <Link
            href={`/project/${id}`}
            className="text-sm text-accent transition hover:opacity-90"
          >
            ← Back to project
          </Link>

          <header className="mt-8">
            <p className="eyebrow">Decide faster</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Compare supplier mixes
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
              You already added materials elsewhere. This page helps you answer:
              which combination of suppliers gives the best balance of{" "}
              <strong className="font-medium text-foreground">price</strong> and{" "}
              <strong className="font-medium text-foreground">
                embodied carbon
              </strong>{" "}
              — without doing spreadsheet math.
            </p>
          </header>
          {optimizationResult && (
            <section className="glass-panel mt-10 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Map: cost vs carbon</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                Don&apos;t worry about the jargon — think of this as a map.
                Horizontal axis is{" "}
                <strong className="text-foreground">total price</strong> for
                everything. Vertical axis is{" "}
                <strong className="text-foreground">total embodied carbon</strong>{" "}
                (pollution from making those materials). Your limits appear as dashed
                guides.
              </p>
              <div className="mt-8">
                <ParetoChart
                  combinations={optimizationResult.combinations}
                  paretoFrontier={optimizationResult.paretoFrontier}
                  carbonBudget={project.carbonBudget}
                  costCeiling={project.costCeiling}
                  baseline={optimizationResult.baseline}
                  selectedCombination={selectedCombination}
                  onSelectCombination={selectCombination}
                />
              </div>

              {selectedCombination && (
                <div className="glass-panel-strong mt-8 rounded-2xl border border-accent/35 bg-panel/50 p-5">
                  <h3 className="text-base font-semibold">Your chosen plan</h3>
                  <p className="mt-1 text-sm text-muted">
                    Totals for this supplier mix across your lines
                  </p>
                  <div className="mt-3 flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-subtle">Price </span>
                      <span className="font-medium text-foreground">
                        {formatInr(selectedCombination.totalCost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle">Carbon </span>
                      <span className="font-medium text-foreground">
                        {formatKgCo2e(selectedCombination.totalCarbon)}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {selectedCombination.selections.map((s) => (
                      <li
                        key={`${s.materialId}-${s.supplierId}`}
                        className="flex flex-wrap gap-x-2 border-b border-border py-2 last:border-0"
                      >
                        <span className="font-medium text-foreground">
                          {labelForMaterial(s.materialId)}
                        </span>
                        <span className="text-subtle">→</span>
                        <span>{s.supplierName}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    className="mt-6"
                    onClick={() => {
                      applySelectedCombinationToMaterials();
                      notifySuccess(
                        "Applied to your project",
                        "Materials now use these suppliers.",
                      );
                    }}
                  >
                    Apply this plan to my materials list
                  </Button>
                </div>
              )}
            </section>
          )}
          <section
            className={cn(
              "glass-panel glass-panel-strong mt-10 border-accent/25 p-6 sm:p-8",
            )}
          >
            <h2 className="text-lg font-semibold">Run the comparison</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Uses your project&apos;s carbon budget (
              {formatKgCo2e(project.carbonBudget)}) and cost ceiling (
              {formatInr(project.costCeiling)}). Add or change materials on the
              Materials page first if needed.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                disabled={loading || materials.length === 0}
                onClick={() => void run()}
                className="px-6 py-3"
              >
                {loading ? "Working…" : "Compare all supplier mixes"}
              </Button>
              {optimizationResult && (
                <span className="text-sm text-muted">
                  Looked at{" "}
                  <strong className="text-foreground">
                    {optimizationResult.totalCombinations.toLocaleString()}
                  </strong>{" "}
                  combinations in {optimizationResult.executionTimeMs.toFixed(0)} ms ·{" "}
                  <strong className="text-accent">
                    {optimizationResult.feasibleCount}
                  </strong>{" "}
                  fit your limits
                </span>
              )}
            </div>
            {materials.length === 0 && (
              <p className="mt-4 text-sm text-[#ffcb45]">
                Add materials on the Materials tab first — there is nothing to
                optimize yet.
              </p>
            )}
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            {optimizationResult?.infeasibleReason && (
              <div className="mt-4 rounded-xl border border-[#ffcb45]/35 bg-[#ffcb45]/10 px-4 py-3 text-sm text-[#ffe8a8]">
                <p className="font-medium text-foreground">
                  No plan meets both limits at once
                </p>
                <p className="mt-1 text-muted">
                  The closest options are still shown on the chart. Your tightest
                  constraint is:{" "}
                  <strong className="text-foreground">
                    {optimizationResult.infeasibleReason === "cost"
                      ? "budget (cost)"
                      : optimizationResult.infeasibleReason === "carbon"
                        ? "carbon target"
                        : "budget and carbon"}
                  </strong>
                  . Try raising the limit that blocks you in project settings, then
                  run again.
                </p>
              </div>
            )}
          </section>

          <section className="glass-panel mt-10 p-6 sm:p-8">
            <h2 className="text-lg font-semibold">How this page works</h2>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-[#06131d]">
                  1
                </span>
                <span>
                  We take every material line on your project and try{" "}
                  <strong className="text-foreground">real supplier options</strong>{" "}
                  from the catalog (every combination we can build).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-[#06131d]">
                  2
                </span>
                <span>
                  We keep only plans that stay{" "}
                  <strong className="text-foreground">under your cost ceiling</strong>{" "}
                  and{" "}
                  <strong className="text-foreground">carbon budget</strong> from
                  project settings.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-[#06131d]">
                  3
                </span>
                <span>
                  The chart shows price (horizontal) and carbon (vertical). The
                  orange line highlights the best tradeoffs — usually you want to
                  be <strong className="text-foreground">down and to the left</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-[#06131d]">
                  4
                </span>
                <span>
                  Pick a dot you like, then{" "}
                  <strong className="text-foreground">apply</strong> it to update
                  your bill of materials, or use negotiation briefs to talk to
                  suppliers.
                </span>
              </li>
            </ol>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Why use this?",
                body: "See thousands of mixes at once instead of guessing supplier by supplier.",
              },
              {
                title: "What is “feasible”?",
                body: "A plan that respects both your money limit and carbon limit at the same time.",
              },
              {
                title: "What should I click?",
                body: "Any dot — hover for numbers. Teal dots are safest; others can still be explored.",
              },
            ].map((box) => (
              <div
                key={box.title}
                className="glass-panel p-5 transition hover:border-accent/30"
              >
                <h3 className="text-sm font-semibold">{box.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{box.body}</p>
              </div>
            ))}
          </section>





          {selectedCombination && (
            <section className="glass-panel mt-10 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Talk to suppliers</h2>
              <p className="mt-2 text-sm text-muted">
                Pick what matters most in the conversation, then generate a short
                brief per supplier.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["cost", "carbon", "balanced"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      priority === p
                        ? "border border-accent bg-accent/20 text-accent shadow-[0_0_18px_-4px_var(--accent-glow)]"
                        : "border border-border bg-panel/80 text-muted hover:border-accent/25",
                    )}
                  >
                    {p === "cost"
                      ? "Push on price"
                      : p === "carbon"
                        ? "Push on carbon"
                        : "Balance both"}
                  </button>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {Array.from(
                  new Map(
                    selectedCombination.selections.map((s) => [
                      s.supplierId,
                      s.supplierName,
                    ]),
                  ).entries(),
                ).map(([sid, name]) => (
                  <div
                    key={sid}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-white/[0.03] px-4 py-3 dark:bg-white/[0.03]"
                  >
                    <span className="text-sm text-foreground">{name}</span>
                    <button
                      type="button"
                      disabled={briefSupplier === sid}
                      onClick={() => void genBrief(name, sid)}
                      className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {briefSupplier === sid ? "Writing…" : "Create brief"}
                    </button>
                  </div>
                ))}
              </div>
              {brief && (
                <div className="glass-panel mt-6 space-y-3 p-5 text-sm">
                  <h3 className="font-semibold">{brief.supplierName}</h3>
                  <ul className="list-inside list-disc space-y-1 text-muted">
                    {brief.talkingPoints.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <p className="text-muted">{brief.volumeDiscountOpportunity}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          await navigator.clipboard.writeText(
                            [
                              ...brief.talkingPoints,
                              ...brief.strategies,
                              ...brief.carbonImprovementSuggestions,
                            ].join("\n"),
                          );
                          notifySuccess("Copied", "Brief is on your clipboard.");
                        } catch {
                          notifyError("Copy failed");
                        }
                      })();
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-accent/10"
                  >
                    Copy all text
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
