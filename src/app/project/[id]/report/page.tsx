"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { downloadProcurementPdf } from "@/components/report/ProcurementPDF";
import { useProject } from "@/context/ProjectContext";
import { notifyError, notifySuccess } from "@/lib/toast";
import { formatInr, formatKgCo2e } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const { project, materials, loadProject } = useProject();
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  const totals = useMemo(() => {
    const totalCost = materials.reduce((a, m) => a + m.totalCost, 0);
    const totalCarbon = materials.reduce((a, m) => a + m.totalCarbon, 0);
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
          totalCost: totals.totalCost,
          totalCarbon: totals.totalCarbon,
          costSavings: 0,
          carbonSavings: 0,
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
    const header = [
      "material",
      "category",
      "supplier",
      "quantity",
      "unit",
      "unitPrice",
      "embodiedCarbonPerUnit",
      "totalCost",
      "totalCarbon",
    ];
    const rows = materials.map((m) =>
      [
        m.materialName,
        m.category,
        m.supplierName,
        m.quantity,
        m.unit,
        m.unitPrice,
        m.embodiedCarbon,
        m.totalCost,
        m.totalCarbon,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materials-${project.name.replace(/\s+/g, "-")}.csv`;
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

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Summary</h2>
          <p className="mt-2 text-muted">
            {formatInr(totals.totalCost)} · {formatKgCo2e(totals.totalCarbon)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Per m² ({totals.assumedArea} m² assumed):{" "}
            {formatInr(totals.costPerSqm)} · {totals.carbonPerSqm.toFixed(2)}{" "}
            kgCO₂e/m²
          </p>
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

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Carbon by category
          </h2>
          <table className="mt-4 w-full text-sm text-foreground">
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
        </Card>
      </main>
    </>
  );
}
