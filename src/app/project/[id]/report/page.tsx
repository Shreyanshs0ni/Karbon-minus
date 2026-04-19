"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import {
  BeforeAfterCarbonChart,
  BeforeAfterCostChart,
  BudgetUtilizationChart,
  CategoryCarbonPie,
} from "@/components/report/ReportCharts";
import { downloadProcurementPdf } from "@/components/report/ProcurementPDF";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { notifyError, notifySuccess } from "@/lib/toast";
import { formatInr, formatKgCo2e, sumMaterialTotals } from "@/lib/utils";

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    project,
    materials,
    loadProject,
    optimizationResult,
    selectedCombination,
    updateProject,
  } = useProject();
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  /** Seeds baseline once per project when still 0/0 (manual projects). */
  const baselineSeededForProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  useEffect(() => {
    if (!project || project.id !== id) return;
    if (project.baselineTotalCost !== 0 || project.baselineTotalCarbon !== 0) return;
    if (materials.length === 0) return;
    if (baselineSeededForProjectRef.current === project.id) return;
    baselineSeededForProjectRef.current = project.id;
    const { totalCost, totalCarbon } = sumMaterialTotals(materials);
    updateProject({
      baselineTotalCost: totalCost,
      baselineTotalCarbon: totalCarbon,
    });
  }, [project, id, materials, updateProject]);

  const totals = useMemo(() => {
    const { totalCost, totalCarbon } = sumMaterialTotals(materials);
    const byCat = new Map<string, { cost: number; carbon: number }>();
    for (const m of materials) {
      const cur = byCat.get(m.category) ?? { cost: 0, carbon: 0 };
      cur.cost += m.totalCost;
      cur.carbon += m.totalCarbon;
      byCat.set(m.category, cur);
    }
    const categoryBreakdown = Array.from(byCat.entries()).map(
      ([category, v]) => ({
        category,
        cost: v.cost,
        carbon: v.carbon,
        percentage: totalCarbon > 0 ? (100 * v.carbon) / totalCarbon : 0,
      }),
    );
    const assumedArea = project?.assumedBuildingArea ?? 10000;
    return {
      totalCost,
      totalCarbon,
      categoryBreakdown,
      costPerSqm: assumedArea > 0 ? totalCost / assumedArea : 0,
      carbonPerSqm: assumedArea > 0 ? totalCarbon / assumedArea : 0,
      assumedArea,
    };
  }, [materials, project?.assumedBuildingArea]);

  const baseline = project
    ? {
        cost: project.baselineTotalCost,
        carbon: project.baselineTotalCarbon,
      }
    : { cost: 0, carbon: 0 };

  const savings = useMemo(() => {
    const costSavings = baseline.cost - totals.totalCost;
    const carbonSavings = baseline.carbon - totals.totalCarbon;
    return {
      costSavings,
      carbonSavings,
      costPct:
        baseline.cost > 0 ? (100 * costSavings) / baseline.cost : 0,
      carbonPct:
        baseline.carbon > 0 ? (100 * carbonSavings) / baseline.carbon : 0,
    };
  }, [baseline.cost, baseline.carbon, totals.totalCost, totals.totalCarbon]);

  async function genSummary() {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          carbonBudget: project.carbonBudget,
          costCeiling: project.costCeiling,
          baselineCost: baseline.cost,
          baselineCarbon: baseline.carbon,
          currentCost: totals.totalCost,
          currentCarbon: totals.totalCarbon,
          costSavings: savings.costSavings,
          carbonSavings: savings.carbonSavings,
          materialCount: materials.length,
        }),
      });
      if (!res.ok) throw new Error("Summary generation failed");
      const data = await res.json();
      setSummary(data.executiveSummary ?? "");
      notifySuccess("Executive summary generated");
    } catch {
      notifyError("Could not generate summary", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!project) return;
    const lines: string[] = [];
    lines.push("section,field,value");
    lines.push(
      `summary,baseline_cost_inr,${baseline.cost}`,
      `summary,baseline_carbon_kgco2e,${baseline.carbon}`,
      `summary,current_cost_inr,${totals.totalCost}`,
      `summary,current_carbon_kgco2e,${totals.totalCarbon}`,
      `summary,cost_savings_inr,${savings.costSavings}`,
      `summary,carbon_savings_kgco2e,${savings.carbonSavings}`,
      `summary,carbon_budget,${project.carbonBudget}`,
      `summary,cost_ceiling,${project.costCeiling}`,
    );
    lines.push(
      "material,material_name,category,supplier,quantity,unit,unit_price,embodied_carbon_per_unit,total_cost,total_carbon_kgco2e",
    );
    for (const m of materials) {
      lines.push(
        [
          "line",
          csvEscape(m.materialName),
          csvEscape(m.category),
          csvEscape(m.supplierName),
          String(m.quantity),
          csvEscape(m.unit),
          String(m.unitPrice),
          String(m.embodiedCarbon),
          String(m.totalCost),
          String(m.totalCarbon),
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procurement-${project.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess("CSV downloaded");
  }

  async function downloadPdf() {
    if (!project) return;
    try {
      await downloadProcurementPdf({
        project,
        materials,
        executiveSummary: summary || "Summary not generated yet.",
        baselineCost: baseline.cost,
        baselineCarbon: baseline.carbon,
        currentCost: totals.totalCost,
        currentCarbon: totals.totalCarbon,
        costSavings: savings.costSavings,
        carbonSavings: savings.carbonSavings,
        totalCost: totals.totalCost,
        totalCarbon: totals.totalCarbon,
        categoryBreakdown: totals.categoryBreakdown,
        costPerSqm: totals.costPerSqm,
        carbonPerSqm: totals.carbonPerSqm,
        assumedArea: totals.assumedArea,
      });
      notifySuccess("PDF downloaded");
    } catch {
      notifyError("Could not download PDF");
    }
  }

  if (!project || project.id !== id) {
    return (
      <>
        <Nav projectId={id} />
        <main className="mx-auto max-w-5xl px-4 py-10">Loading…</main>
      </>
    );
  }

  const hasBaseline =
    baseline.cost > 0 || baseline.carbon > 0 || materials.length > 0;
  const winCost = savings.costSavings > 0;
  const winCarb = savings.carbonSavings > 0;

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
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Report</h1>

        {(winCost || winCarb) && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 px-5 py-4 text-foreground shadow-sm">
            <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
              Great progress on your procurement mix
            </p>
            <p className="mt-1 text-sm text-label">
              {winCost && (
                <>
                  You saved approximately{" "}
                  <strong>{formatInr(savings.costSavings)}</strong> on cost
                  {winCarb ? " and " : "."}
                </>
              )}
              {winCarb && (
                <>
                  <strong>{formatKgCo2e(savings.carbonSavings)}</strong> of
                  embodied carbon versus your baseline at project creation.
                </>
              )}
            </p>
          </div>
        )}

        {!winCost && !winCarb && hasBaseline && (
          <div className="mt-4 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted">
            Current totals are aligned with your creation baseline. Adjust
            materials or run optimization to unlock further savings.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-emerald-500/20">
            <h2 className="text-lg font-medium text-foreground">
              Before vs after (creation baseline → now)
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase text-subtle">
                  Baseline
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatInr(baseline.cost)}
                </p>
                <p className="text-sm text-muted">
                  {formatKgCo2e(baseline.carbon)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
                <p className="text-xs font-medium uppercase text-subtle">
                  Current
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatInr(totals.totalCost)}
                </p>
                <p className="text-sm text-muted">
                  {formatKgCo2e(totals.totalCarbon)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">
              Per m² ({totals.assumedArea} m² assumed):{" "}
              {formatInr(totals.costPerSqm)} · {totals.carbonPerSqm.toFixed(2)}{" "}
              kgCO₂e/m²
            </p>
            <div className="mt-6 space-y-8">
              <BeforeAfterCostChart
                baselineCost={baseline.cost}
                currentCost={totals.totalCost}
              />
              <BeforeAfterCarbonChart
                baselineCarbon={baseline.carbon}
                currentCarbon={totals.totalCarbon}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-medium text-foreground">
              Budget utilization
            </h2>
            <p className="mt-1 text-sm text-muted">
              How much of your stated limits the current shortlist uses.
            </p>
            <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:justify-around">
              <BudgetUtilizationChart
                label="Carbon budget"
                actual={totals.totalCarbon}
                limit={project.carbonBudget}
                formatActual={formatKgCo2e}
                formatLimit={formatKgCo2e}
              />
              <BudgetUtilizationChart
                label="Cost ceiling"
                actual={totals.totalCost}
                limit={project.costCeiling}
                formatActual={formatInr}
                formatLimit={formatInr}
              />
            </div>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Carbon by category
          </h2>
          <div className="mt-4 grid gap-8 lg:grid-cols-2">
            <table className="w-full text-sm text-foreground">
              <thead>
                <tr className="text-left text-subtle">
                  <th className="py-2">Category</th>
                  <th>Carbon</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {totals.categoryBreakdown.map((c) => (
                  <tr key={c.category} className="border-t border-divide">
                    <td className="py-2">{c.category}</td>
                    <td>{formatKgCo2e(c.carbon)}</td>
                    <td>{c.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CategoryCarbonPie breakdown={totals.categoryBreakdown} />
          </div>
        </Card>

        {optimizationResult && selectedCombination && (
          <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
            <h2 className="text-lg font-medium text-foreground">
              Optimization shortlist (supplier mix)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Compared to the default supplier index mix from the last run.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-subtle">Default mix (baseline)</p>
                <p className="font-medium">
                  {formatInr(optimizationResult.baseline.totalCost)} ·{" "}
                  {formatKgCo2e(optimizationResult.baseline.totalCarbon)}
                </p>
              </div>
              <div>
                <p className="text-xs text-subtle">Selected shortlist</p>
                <p className="font-medium">
                  {formatInr(selectedCombination.totalCost)} ·{" "}
                  {formatKgCo2e(selectedCombination.totalCarbon)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Summary</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading}
              onClick={() => void genSummary()}
            >
              {loading ? "…" : "Generate executive summary (AI)"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void downloadPdf()}
            >
              Download PDF
            </Button>
            <Button type="button" variant="secondary" onClick={downloadCsv}>
              Download CSV
            </Button>
          </div>
          {summary && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-label">
              {summary}
            </p>
          )}
        </Card>
      </main>
    </>
  );
}
