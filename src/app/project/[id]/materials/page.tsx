"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { MaterialInput } from "@/components/materials/MaterialInput";
import { MaterialList } from "@/components/materials/MaterialList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import { notifyInfo, notifySuccess } from "@/lib/toast";
import { buildProjectMaterial } from "@/lib/materials";
import type { AlternativeSuggestion, MaterialEntry } from "@/types";

export default function MaterialsPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    project,
    materials,
    loadProject,
    addMaterial,
    removeMaterial,
    updateMaterialQuantity,
    replaceMaterialLine,
  } = useProject();

  const [browse, setBrowse] = useState<MaterialEntry[]>([]);
  const [cat, setCat] = useState<string>("all");
  const [alternatives, setAlternatives] = useState<AlternativeSuggestion[]>([]);
  const [altLoading, setAltLoading] = useState(false);

  useEffect(() => {
    if (id && project?.id !== id) loadProject(id);
  }, [id, project?.id, loadProject]);

  useEffect(() => {
    const q = new URLSearchParams();
    if (cat !== "all") q.set("category", cat);
    void fetch(`/api/materials?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => setBrowse(d.materials ?? []));
  }, [cat]);

  useEffect(() => {
    if (materials.length === 0) {
      setAlternatives([]);
      return;
    }
    setAltLoading(true);
    void fetch("/api/ai/alternatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materials }),
    })
      .then((r) => r.json())
      .then((d) => setAlternatives(d.suggestions ?? []))
      .finally(() => setAltLoading(false));
  }, [materials]);

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
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Materials
        </h1>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Add with AI</h2>
          <MaterialInput
            onAdd={(pm) => {
              addMaterial(pm);
              notifySuccess(
                "Material added",
                `${pm.materialName} added to project.`,
              );
            }}
            existingMaterialIds={materials.map((m) => m.materialId)}
          />
        </Card>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Browse database
          </h2>
          <div className="mt-2">
            <label className="text-sm text-muted">Category</label>
            <select
              className="ml-2 rounded border border-border bg-input-bg px-2 py-1 text-sm text-foreground"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="all">All</option>
              <option value="steel">Steel</option>
              <option value="cement">Cement</option>
              <option value="insulation">Insulation</option>
              <option value="glass">Glass</option>
              <option value="aggregates">Aggregates</option>
              <option value="timber">Timber</option>
            </select>
          </div>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
            {browse.slice(0, 40).map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-divide py-2 text-foreground"
              >
                <span>
                  {m.name} <span className="text-subtle">({m.category})</span>
                </span>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const pm = buildProjectMaterial(m, 1000);
                    addMaterial(pm);
                    notifySuccess(
                      "Material added",
                      `${m.name} added from database.`,
                    );
                  }}
                >
                  Add 1000 {m.unit}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Project line items
          </h2>
          <MaterialList
            materials={materials}
            onRemove={(lineId) => {
              removeMaterial(lineId);
              notifyInfo("Material removed");
            }}
            onQuantityChange={updateMaterialQuantity}
          />
        </Card>

        <Card className="mt-6">
          <h2 className="text-lg font-medium text-foreground">
            Lower-carbon alternatives
          </h2>
          {altLoading && <p className="text-sm text-subtle">Analyzing…</p>}
          {!altLoading && alternatives.length === 0 && (
            <p className="text-sm text-muted">No suggestions yet.</p>
          )}
          <ul className="mt-4 space-y-4">
            {alternatives.slice(0, 8).map((a, i) => (
              <li
                key={i}
                className="rounded border border-border p-3 text-sm text-foreground"
              >
                <div className="font-medium">
                  Replace {a.currentMaterial.materialName}
                </div>
                <div className="mt-1 text-muted">
                  → {a.alternative.name} ({a.alternativeSupplier.name})
                </div>
                <p className="mt-2 text-label">{a.explanation}</p>
                <Button
                  className="mt-2"
                  type="button"
                  onClick={() => {
                    const next = buildProjectMaterial(
                      a.alternative,
                      a.currentMaterial.quantity,
                      a.alternativeSupplier.id,
                      a.currentMaterial.id,
                    );
                    replaceMaterialLine(a.currentMaterial.id, next);
                    notifySuccess(
                      "Material swapped",
                      `${a.alternative.name} is now in the shortlist.`,
                    );
                  }}
                >
                  Swap in project
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </>
  );
}
