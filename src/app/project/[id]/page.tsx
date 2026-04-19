"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useProject } from "@/context/ProjectContext";
import { notifySuccess } from "@/lib/toast";
import { formatInr, formatKgCo2e } from "@/lib/utils";

export default function ProjectDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const { project, materials, loadProject, updateProject } = useProject();
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCarbon, setFormCarbon] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  useEffect(() => {
    if (!project || editOpen) return;
    setFormName(project.name);
    setFormCarbon(String(project.carbonBudget));
    setFormCost(String(project.costCeiling));
    setFormArea(String(project.assumedBuildingArea ?? 10000));
  }, [project, editOpen]);

  const totalCost = materials.reduce((a, m) => a + m.totalCost, 0);
  const totalCarbon = materials.reduce((a, m) => a + m.totalCarbon, 0);

  const utilization = useMemo(() => {
    if (!project) return { carbonPct: 0, costPct: 0 };
    const carbonPct =
      project.carbonBudget > 0
        ? Math.min(100, (totalCarbon / project.carbonBudget) * 100)
        : 0;
    const costPct =
      project.costCeiling > 0
        ? Math.min(100, (totalCost / project.costCeiling) * 100)
        : 0;
    return { carbonPct, costPct };
  }, [project, totalCarbon, totalCost]);

  function saveProjectSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setFormError(null);
    const cb = Number(formCarbon);
    const cc = Number(formCost);
    const ar = Number(formArea);
    if (!formName.trim()) {
      setFormError("Project name is required.");
      return;
    }
    if (!(cb > 0) || !(cc > 0)) {
      setFormError("Carbon budget and cost ceiling must be positive.");
      return;
    }
    if (!(ar > 0)) {
      setFormError("Assumed building area must be positive.");
      return;
    }
    updateProject({
      name: formName.trim(),
      carbonBudget: cb,
      costCeiling: cc,
      assumedBuildingArea: ar,
    });
    setEditOpen(false);
    notifySuccess("Project updated", "Budgets and name saved.");
  }

  if (!project || project.id !== id) {
    return (
      <>
        <Nav projectId={id} />
        <main className="page-shell">Loading…</main>
      </>
    );
  }

  return (
    <>
      <Nav projectId={id} />
      <main className="page-shell">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {project.name}
            </h1>
            <p className="mt-2 text-muted">Procurement dashboard — budgets & totals</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
            Edit project
          </Button>
        </div>

        {editOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
          >
            <Card className="relative w-full max-w-md border-accent/20 p-6 shadow-2xl">
              <h2 id="edit-project-title" className="text-lg font-semibold">
                Edit project
              </h2>
              <form onSubmit={saveProjectSettings} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-label">Name</label>
                  <Input
                    className="mt-1"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-label">
                    Carbon budget (kgCO₂e)
                  </label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0.001}
                    step="any"
                    value={formCarbon}
                    onChange={(e) => setFormCarbon(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-label">
                    Cost ceiling (INR)
                  </label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0.001}
                    step="any"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-label">
                    Assumed building area (m²)
                  </label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0.001}
                    step="any"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                  />
                </div>
                {formError && (
                  <p className="text-sm text-danger">{formError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-sm font-medium text-subtle">Carbon budget</h2>
            <p className="mt-1 text-2xl font-semibold">
              {formatKgCo2e(project.carbonBudget)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{
                  width: `${utilization.carbonPct}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Current {formatKgCo2e(totalCarbon)} ·{" "}
              {utilization.carbonPct.toFixed(0)}% of budget
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-medium text-subtle">Cost ceiling</h2>
            <p className="mt-1 text-2xl font-semibold">
              {formatInr(project.costCeiling)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500 dark:bg-sky-400"
                style={{
                  width: `${utilization.costPct}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Current {formatInr(totalCost)} · {utilization.costPct.toFixed(0)}%
              of ceiling
            </p>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Baseline vs current (at creation → now)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Baseline totals are frozen when the project is created. Current
            totals reflect your line items today.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm text-subtle">Baseline cost / carbon</span>
              <div className="font-medium text-foreground">
                {formatInr(project.baselineTotalCost)} ·{" "}
                {formatKgCo2e(project.baselineTotalCarbon)}
              </div>
            </div>
            <div>
              <span className="text-sm text-subtle">Current cost / carbon</span>
              <div className="font-medium text-foreground">
                {formatInr(totalCost)} · {formatKgCo2e(totalCarbon)}
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            Materials: {materials.length} line items
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/project/${id}/materials`}>
              <Button>Manage materials</Button>
            </Link>
            <Link href={`/project/${id}/optimize`}>
              <Button variant="secondary">Run optimization</Button>
            </Link>
            <Link href={`/project/${id}/report`}>
              <Button variant="secondary">Report</Button>
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
