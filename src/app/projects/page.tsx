"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { notifySuccess } from "@/lib/toast";
import { formatInr, formatKgCo2e } from "@/lib/utils";

export default function ProjectsPage() {
  const { projects, deleteProject } = useProject();

  function handleDeleteProject(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete project "${name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteProject(id);
    notifySuccess(
      "Project deleted",
      `${name} was removed from your saved projects.`,
    );
  }

  return (
    <>
      <Nav />
      <main className="page-shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your projects
            </h1>
            <p className="mt-2 max-w-lg text-muted">
              Compare materials, optimize cost vs carbon, and brief suppliers —
              same glass UI everywhere.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/project/new">
              <Button>New project</Button>
            </Link>
          </div>
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            All projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-muted">
              No projects yet. Create one or load the demo from the navbar.
            </p>
          ) : (
            <ul className="divide-y divide-divide">
              {projects.map(({ project }) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-4"
                >
                  <div>
                    <Link
                      href={`/project/${project.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {project.name}
                    </Link>
                    <div className="mt-1 text-xs text-subtle">
                      Budget {formatKgCo2e(project.carbonBudget)} · Ceiling{" "}
                      {formatInr(project.costCeiling)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/project/${project.id}`}>
                      <Button variant="secondary">Open</Button>
                    </Link>
                    <Button
                      variant="secondary"
                      className="border-danger/50 text-danger hover:bg-danger/10"
                      onClick={() =>
                        handleDeleteProject(project.id, project.name)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </>
  );
}
