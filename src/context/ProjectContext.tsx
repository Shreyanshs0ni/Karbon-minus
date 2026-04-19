"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { getMaterialById } from "@/lib/db";
import { buildProjectMaterial } from "@/lib/materials";
import {
  loadActiveProjectId,
  loadProjects,
  saveActiveProjectId,
  saveProjects,
} from "@/lib/storage";
import { notifyError } from "@/lib/toast";
import {
  AllDemosLoadedError,
  collectUsedDemoTemplateIds,
} from "@/lib/demo-templates";
import type {
  MaterialCombination,
  OptimizationResult,
  Project,
  ProjectMaterial,
  StoredProjectBundle,
} from "@/types";

type State = {
  projects: StoredProjectBundle[];
  activeProjectId: string | null;
};

type Action =
  | {
      type: "hydrate";
      projects: StoredProjectBundle[];
      activeId: string | null;
    }
  | { type: "setState"; patch: Partial<State> };

function reducer(state: State, action: Action): State {
  if (action.type === "hydrate") {
    return {
      projects: action.projects,
      activeProjectId: action.activeId,
    };
  }
  return { ...state, ...action.patch };
}

type Ctx = {
  project: Project | null;
  materials: ProjectMaterial[];
  optimizationResult: OptimizationResult | null;
  selectedCombination: MaterialCombination | null;
  projects: StoredProjectBundle[];
  createProject: (data: {
    name: string;
    carbonBudget: number;
    costCeiling: number;
    assumedBuildingArea?: number;
  }) => string;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  addMaterial: (m: ProjectMaterial) => void;
  removeMaterial: (lineId: string) => void;
  updateMaterialQuantity: (lineId: string, quantity: number) => void;
  replaceMaterialLine: (lineId: string, next: ProjectMaterial) => void;
  setOptimizationResult: (r: OptimizationResult | null) => void;
  selectCombination: (c: MaterialCombination | null) => void;
  updateProject: (patch: Partial<Project>) => void;
  applySelectedCombinationToMaterials: () => void;
  loadDemo: () => Promise<{ name: string }>;
};

const ProjectContext = createContext<Ctx | null>(null);

function getBundle(
  projects: StoredProjectBundle[],
  id: string | null,
): StoredProjectBundle | null {
  if (!id) return null;
  return projects.find((p) => p.project.id === id) ?? null;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    activeProjectId: null,
  });

  useEffect(() => {
    dispatch({
      type: "hydrate",
      projects: loadProjects(),
      activeId: loadActiveProjectId(),
    });
  }, []);

  const persist = useCallback(
    (projects: StoredProjectBundle[], activeId: string | null) => {
      const ok = saveProjects(projects);
      if (!ok) {
        notifyError(
          "Could not save to browser storage",
          "Optimization or project data may be too large. This session still works, but a refresh may lose unsaved changes.",
        );
      }
      saveActiveProjectId(activeId);
    },
    [],
  );

  const activeBundle = useMemo(
    () => getBundle(state.projects, state.activeProjectId),
    [state.projects, state.activeProjectId],
  );

  const project = activeBundle?.project ?? null;
  const materials = activeBundle?.materials ?? [];
  const optimizationResult = activeBundle?.lastOptimization ?? null;

  const selectedCombination = useMemo(() => {
    const sid = activeBundle?.selectedCombinationId;
    if (!optimizationResult || !sid) return null;
    const fromCombo = optimizationResult.combinations.find((c) => c.id === sid);
    if (fromCombo) return fromCombo;
    return optimizationResult.paretoFrontier.find((c) => c.id === sid) ?? null;
  }, [optimizationResult, activeBundle?.selectedCombinationId]);

  const mutate = useCallback(
    (fn: (b: StoredProjectBundle) => StoredProjectBundle) => {
      if (!state.activeProjectId) return;
      const next = state.projects.map((b) =>
        b.project.id === state.activeProjectId ? fn(b) : b,
      );
      persist(next, state.activeProjectId);
      dispatch({ type: "setState", patch: { projects: next } });
    },
    [state.activeProjectId, state.projects, persist],
  );

  const createProject = useCallback(
    (data: {
      name: string;
      carbonBudget: number;
      costCeiling: number;
      assumedBuildingArea?: number;
    }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const p: Project = {
        id,
        name: data.name,
        carbonBudget: data.carbonBudget,
        costCeiling: data.costCeiling,
        assumedBuildingArea: data.assumedBuildingArea,
        baselineTotalCost: 0,
        baselineTotalCarbon: 0,
        createdAt: now,
        updatedAt: now,
      };
      const bundle: StoredProjectBundle = { project: p, materials: [] };
      const next = [...state.projects, bundle];
      persist(next, id);
      dispatch({
        type: "setState",
        patch: { projects: next, activeProjectId: id },
      });
      return id;
    },
    [state.projects, persist],
  );

  const loadProject = useCallback((id: string) => {
    saveActiveProjectId(id);
    dispatch({
      type: "setState",
      patch: { activeProjectId: id },
    });
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      const next = state.projects.filter((bundle) => bundle.project.id !== id);
      const nextActiveId =
        state.activeProjectId === id ? null : state.activeProjectId;
      persist(next, nextActiveId);
      dispatch({
        type: "setState",
        patch: { projects: next, activeProjectId: nextActiveId },
      });
    },
    [state.projects, state.activeProjectId, persist],
  );

  const setActiveProject = useCallback(
    (id: string | null) => {
      persist(state.projects, id);
      dispatch({
        type: "setState",
        patch: { activeProjectId: id },
      });
    },
    [state.projects, persist],
  );

  const addMaterial = useCallback(
    (m: ProjectMaterial) => {
      mutate((b) => ({
        ...b,
        materials: [...b.materials, m],
        project: { ...b.project, updatedAt: new Date().toISOString() },
      }));
    },
    [mutate],
  );

  const removeMaterial = useCallback(
    (lineId: string) => {
      mutate((b) => ({
        ...b,
        materials: b.materials.filter((x) => x.id !== lineId),
        project: { ...b.project, updatedAt: new Date().toISOString() },
      }));
    },
    [mutate],
  );

  const updateMaterialQuantity = useCallback(
    (lineId: string, quantity: number) => {
      mutate((b) => ({
        ...b,
        materials: b.materials.map((x) => {
          if (x.id !== lineId) return x;
          const totalCost = quantity * x.unitPrice;
          const totalCarbon = quantity * x.embodiedCarbon;
          return { ...x, quantity, totalCost, totalCarbon };
        }),
        project: { ...b.project, updatedAt: new Date().toISOString() },
      }));
    },
    [mutate],
  );

  const replaceMaterialLine = useCallback(
    (lineId: string, next: ProjectMaterial) => {
      mutate((b) => ({
        ...b,
        materials: b.materials.map((x) => (x.id === lineId ? next : x)),
        project: { ...b.project, updatedAt: new Date().toISOString() },
      }));
    },
    [mutate],
  );

  const updateProject = useCallback(
    (patch: Partial<Project>) => {
      mutate((b) => ({
        ...b,
        project: {
          ...b.project,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [mutate],
  );

  const applySelectedCombinationToMaterials = useCallback(() => {
    const comb = selectedCombination;
    if (!comb || !state.activeProjectId) return;
    mutate((b) => ({
      ...b,
      materials: b.materials.map((pm) => {
        const sel = comb.selections.find((s) => s.materialId === pm.materialId);
        if (!sel) return pm;
        const mat = getMaterialById(pm.materialId);
        if (!mat) return pm;
        return buildProjectMaterial(mat, pm.quantity, sel.supplierId, pm.id);
      }),
      project: { ...b.project, updatedAt: new Date().toISOString() },
    }));
  }, [mutate, selectedCombination, state.activeProjectId]);

  const setOptimizationResult = useCallback(
    (result: OptimizationResult | null) => {
      mutate((b) => ({
        ...b,
        lastOptimization: result ?? undefined,
        selectedCombinationId: undefined,
        project: { ...b.project, updatedAt: new Date().toISOString() },
      }));
    },
    [mutate],
  );

  const selectCombination = useCallback(
    (c: MaterialCombination | null) => {
      if (!state.activeProjectId) return;
      const next = state.projects.map((b) =>
        b.project.id === state.activeProjectId
          ? {
              ...b,
              selectedCombinationId: c?.id,
              project: { ...b.project, updatedAt: new Date().toISOString() },
            }
          : b,
      );
      persist(next, state.activeProjectId);
      dispatch({ type: "setState", patch: { projects: next } });
    },
    [state.activeProjectId, state.projects, persist],
  );

  const loadDemo = useCallback(async () => {
    const used = collectUsedDemoTemplateIds(state.projects);
    const qs =
      used.length > 0 ? `?exclude=${encodeURIComponent(used.join(","))}` : "";
    const res = await fetch(`/api/demo${qs}`);
    if (res.status === 404) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (body.error === "all_demos_used") throw new AllDemosLoadedError();
      throw new Error("Demo load failed");
    }
    if (!res.ok) throw new Error("Demo load failed");
    const data = (await res.json()) as {
      project: Project;
      materials: ProjectMaterial[];
      demoTemplateId: string;
    };
    const now = new Date().toISOString();
    const baselineTotalCost = data.materials.reduce((a, m) => a + m.totalCost, 0);
    const baselineTotalCarbon = data.materials.reduce(
      (a, m) => a + m.totalCarbon,
      0,
    );
    const project: Project = {
      ...data.project,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      demoTemplateId: data.demoTemplateId,
      baselineTotalCost,
      baselineTotalCarbon,
    };
    const bundle: StoredProjectBundle = {
      project,
      materials: data.materials,
    };
    const next = [...state.projects, bundle];
    persist(next, bundle.project.id);
    dispatch({
      type: "setState",
      patch: {
        projects: next,
        activeProjectId: bundle.project.id,
      },
    });
    return { name: project.name };
  }, [state.projects, persist]);

  const value: Ctx = {
    project,
    materials,
    optimizationResult,
    selectedCombination,
    projects: state.projects,
    createProject,
    loadProject,
    deleteProject,
    setActiveProject,
    addMaterial,
    removeMaterial,
    updateMaterialQuantity,
    replaceMaterialLine,
    setOptimizationResult,
    selectCombination,
    updateProject,
    applySelectedCombinationToMaterials,
    loadDemo,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const v = useContext(ProjectContext);
  if (!v) throw new Error("useProject must be inside ProjectProvider");
  return v;
}
