import demosFile from "../../data/demo-projects.json";
import type { Project, StoredProjectBundle } from "@/types";

type DemosRoot = {
  demos: Array<{ project: Pick<Project, "id" | "name"> }>;
};

export class AllDemosLoadedError extends Error {
  constructor() {
    super(
      "All demo scenarios are already in your project list. Delete one if you want to load it again.",
    );
    this.name = "AllDemosLoadedError";
  }
}

/** Prefer persisted field; infer legacy demos by exact name match to catalog. */
export function inferDemoTemplateId(project: Project): string | undefined {
  if (project.demoTemplateId) return project.demoTemplateId;
  const { demos } = demosFile as DemosRoot;
  return demos.find((d) => d.project.name === project.name)?.project.id;
}

export function collectUsedDemoTemplateIds(
  bundles: StoredProjectBundle[],
): string[] {
  const ids = new Set<string>();
  for (const b of bundles) {
    const tid = inferDemoTemplateId(b.project);
    if (tid) ids.add(tid);
  }
  return Array.from(ids);
}
