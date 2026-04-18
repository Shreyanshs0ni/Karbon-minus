"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { formatInr, formatKgCo2e } from "@/lib/utils";

export default function HomePage() {
  const { projects, loadDemo } = useProject();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Embodied Carbon Negotiator
            </h1>
            <p className="mt-1 text-slate-600">
              Compare materials, optimize cost vs carbon, and brief suppliers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadDemo()}>
              Load demo (Bangalore)
            </Button>
            <Link href="/project/new">
              <Button>New project</Button>
            </Link>
          </div>
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-medium">Your projects</h2>
          {projects.length === 0 ? (
            <p className="text-slate-600">
              No projects yet. Create one or load the Bangalore demo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.map(({ project }) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-4"
                >
                  <div>
                    <Link
                      href={`/project/${project.id}`}
                      className="font-medium text-emerald-900 hover:underline"
                    >
                      {project.name}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">
                      Budget {formatKgCo2e(project.carbonBudget)} · Ceiling{" "}
                      {formatInr(project.costCeiling)}
                    </div>
                  </div>
                  <Link href={`/project/${project.id}`}>
                    <Button variant="secondary">Open</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </>
  );
}
