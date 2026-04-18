"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { formatInr, formatKgCo2e } from "@/lib/utils";

export default function ProjectDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const { project, materials, loadProject } = useProject();

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  if (!project || project.id !== id) {
    return (
      <>
        <Nav projectId={id} />
        <main className="mx-auto max-w-5xl px-4 py-10">Loading…</main>
      </>
    );
  }

  const totalCost = materials.reduce((a, m) => a + m.totalCost, 0);
  const totalCarbon = materials.reduce((a, m) => a + m.totalCarbon, 0);

  return (
    <>
      <Nav projectId={id} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-foreground">
          {project.name}
        </h1>
        <p className="mt-1 text-muted">Procurement dashboard</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-sm font-medium text-subtle">Carbon budget</h2>
            <p className="mt-1 text-2xl font-semibold">
              {formatKgCo2e(project.carbonBudget)}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-medium text-subtle">Cost ceiling</h2>
            <p className="mt-1 text-2xl font-semibold">
              {formatInr(project.costCeiling)}
            </p>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Current totals
          </h2>
          <p className="mt-2 text-muted">
            Materials: {materials.length} line items
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div>
              <span className="text-sm text-subtle">Total cost</span>
              <div className="font-medium text-foreground">
                {formatInr(totalCost)}
              </div>
            </div>
            <div>
              <span className="text-sm text-subtle">Total embodied carbon</span>
              <div className="font-medium text-foreground">
                {formatKgCo2e(totalCarbon)}
              </div>
            </div>
          </div>
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
