"use client";

import { MAX_STORED_COMBINATIONS, slimOptimizationResult } from "@/lib/optimization";
import type { StoredProjectBundle } from "@/types";

const PROJECTS_KEY = "ecn_projects";
const ACTIVE_KEY = "ecn_active_project";

function migrateBundle(b: StoredProjectBundle): StoredProjectBundle {
  let project = b.project;
  if (
    typeof project.baselineTotalCost !== "number" ||
    typeof project.baselineTotalCarbon !== "number"
  ) {
    const cost = b.materials.reduce((a, m) => a + m.totalCost, 0);
    const carbon = b.materials.reduce((a, m) => a + m.totalCarbon, 0);
    project = {
      ...b.project,
      baselineTotalCost: cost,
      baselineTotalCarbon: carbon,
    };
  }
  let lastOptimization = b.lastOptimization;
  if (
    lastOptimization &&
    lastOptimization.combinations.length > MAX_STORED_COMBINATIONS
  ) {
    lastOptimization = slimOptimizationResult(lastOptimization);
  }
  return { ...b, project, lastOptimization };
}

export function loadProjects(): StoredProjectBundle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProjectBundle[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateBundle);
  } catch {
    return [];
  }
}

/** Returns false if quota exceeded; caller may toast and keep in-memory state only. */
export function saveProjects(projects: StoredProjectBundle[]): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    console.error("LocalStorage save failed", e);
    return false;
  }
}

export function loadActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}
