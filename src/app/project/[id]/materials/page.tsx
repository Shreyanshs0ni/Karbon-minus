"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { MaterialInput } from "@/components/materials/MaterialInput";
import { MaterialList } from "@/components/materials/MaterialList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useProject } from "@/context/ProjectContext";
import { getMaterialById } from "@/lib/db";
import { DEFAULT_STARTER_MATERIALS } from "@/lib/default-starter-materials";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/toast";
import { formatInr, formatKgCo2e } from "@/lib/utils";
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
  /** Quantity typed per catalog row (same unit as the material, e.g. kg). */
  const [browseQtyById, setBrowseQtyById] = useState<Record<string, string>>(
    {},
  );
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

  /** Only refetch when line items are added or removed, not on swap/qty edit. */
  const lineIdsKey = useMemo(
    () => materials.map((m) => m.id).sort().join("|"),
    [materials],
  );

  useEffect(() => {
    if (materials.length === 0) {
      setAlternatives([]);
      return;
    }
    setAltLoading(true);
    let cancelled = false;
    void fetch("/api/ai/alternatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materials }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAlternatives(d.suggestions ?? []);
      })
      .finally(() => {
        if (!cancelled) setAltLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only refetch when line IDs or line count change — not on swap/qty (materials content omitted on purpose).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- materials is read when lineIdsKey/length change
  }, [lineIdsKey, project?.id, materials.length]);

  const mergedAlternatives = useMemo(() => {
    return alternatives.map((a) => {
      const line = materials.find((m) => m.id === a.currentMaterial.id);
      return {
        ...a,
        currentMaterial: line ?? a.currentMaterial,
      };
    });
  }, [alternatives, materials]);

  const suggestionsByLineId = useMemo(() => {
    const map = new Map<string, typeof mergedAlternatives>();
    for (const a of mergedAlternatives) {
      const lid = a.currentMaterial.id;
      if (!map.has(lid)) map.set(lid, []);
      map.get(lid)!.push(a);
    }
    return map;
  }, [mergedAlternatives]);

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

        {materials.length < 4 && (
          <Card className="mt-6 border-emerald-500/30 bg-emerald-500/5">
            <h2 className="text-lg font-medium text-foreground">
              Suggested starters
            </h2>
            <p className="mt-1 text-sm text-muted">
              Quick-add typical line items to begin comparing embodied carbon.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {DEFAULT_STARTER_MATERIALS.map((s) => {
                const mat = getMaterialById(s.materialId);
                if (!mat) return null;
                return (
                  <Button
                    key={s.materialId}
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const pm = buildProjectMaterial(mat, s.defaultQty);
                      addMaterial(pm);
                      notifySuccess("Added", `${mat.name} (${s.defaultQty} ${mat.unit})`);
                    }}
                  >
                    + {s.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        )}

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
                className="flex flex-wrap items-center justify-between gap-3 border-b border-divide py-2 text-foreground"
              >
                <span className="min-w-0 flex-1">
                  {m.name} <span className="text-subtle">({m.category})</span>
                </span>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted">
                      {m.unit === "kg" ? "Qty (kg)" : `Qty (${m.unit})`}
                    </span>
                    <Input
                      type="number"
                      min={0.001}
                      step="any"
                      inputMode="decimal"
                      className="w-28 py-1.5"
                      value={browseQtyById[m.id] ?? ""}
                      onChange={(e) =>
                        setBrowseQtyById((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <Button
                    variant="secondary"
                    type="button"
                    className="self-end"
                    onClick={() => {
                      const raw = browseQtyById[m.id]?.trim() ?? "";
                      const q = Number(raw);
                      if (!(q > 0)) {
                        notifyError(
                          "Enter a quantity",
                          `Add a positive amount in ${m.unit}.`,
                        );
                        return;
                      }
                      const pm = buildProjectMaterial(m, q);
                      addMaterial(pm);
                      setBrowseQtyById((prev) => {
                        const next = { ...prev };
                        delete next[m.id];
                        return next;
                      });
                      notifySuccess(
                        "Material added",
                        `${m.name} (${q} ${m.unit}) added from database.`,
                      );
                    }}
                  >
                    Add
                  </Button>
                </div>
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
          <p className="mt-1 text-sm text-muted">
            Options per line item. Δ values are from the last refresh (swap or
            qty edits do not reload the list). Use refresh to recalculate after
            quantity changes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={altLoading || materials.length === 0}
              onClick={() => {
                if (materials.length === 0) return;
                setAltLoading(true);
                void fetch("/api/ai/alternatives", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ materials }),
                })
                  .then((r) => r.json())
                  .then((d) => setAlternatives(d.suggestions ?? []))
                  .finally(() => setAltLoading(false));
                notifyInfo(
                  "Refreshing suggestions",
                  "Recalculating alternatives.",
                );
              }}
            >
              {altLoading ? "Refreshing…" : "Refresh suggestions"}
            </Button>
          </div>
          {altLoading && <p className="mt-2 text-sm text-subtle">Analyzing…</p>}
          {!altLoading && materials.length === 0 && (
            <p className="mt-2 text-sm text-muted">Add materials to see swaps.</p>
          )}
          {!altLoading && materials.length > 0 && (
            <div className="mt-4 space-y-8">
              {materials.map((line) => {
                const row = suggestionsByLineId.get(line.id) ?? [];
                return (
                  <div key={line.id} className="border-b border-divide pb-6 last:border-0">
                    <div className="font-medium text-foreground">
                      {line.materialName}{" "}
                      <span className="text-sm font-normal text-muted">
                        ({line.quantity} {line.unit})
                      </span>
                    </div>
                    {row.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        No lower-carbon catalog swap found for this line. Try
                        Refresh suggestions after changing quantities.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {row.map((a) => {
                          const applied =
                            line.materialId === a.alternative.id;
                          return (
                            <li
                              key={`${line.id}-${a.alternative.id}-${a.alternativeSupplier.id}`}
                              className={`rounded border p-3 text-sm text-foreground ${
                                applied
                                  ? "border-border/60 bg-muted/30 opacity-80"
                                  : "border-border bg-card/50"
                              }`}
                            >
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
                                <span>
                                  → {a.alternative.name} ·{" "}
                                  {a.alternativeSupplier.name}
                                </span>
                                <span className="text-emerald-700 dark:text-emerald-300">
                                  Δ carbon {formatKgCo2e(a.carbonSavings)} (
                                  {a.carbonSavingsPercent.toFixed(1)}%)
                                </span>
                                <span
                                  className={
                                    a.costDifference <= 0
                                      ? "text-emerald-700 dark:text-emerald-300"
                                      : "text-amber-800 dark:text-amber-200"
                                  }
                                >
                                  Δ cost {formatInr(a.costDifference)} (
                                  {a.costDifferencePercent.toFixed(1)}%)
                                </span>
                              </div>
                              <p className="mt-2 text-label">{a.explanation}</p>
                              {applied ? (
                                <p className="mt-2 text-xs font-medium text-subtle">
                                  Already in project — this catalog option is
                                  your current line.
                                </p>
                              ) : null}
                              <Button
                                className="mt-2"
                                type="button"
                                disabled={applied}
                                variant={applied ? "secondary" : "primary"}
                                onClick={() => {
                                  const next = buildProjectMaterial(
                                    a.alternative,
                                    line.quantity,
                                    a.alternativeSupplier.id,
                                    line.id,
                                  );
                                  replaceMaterialLine(line.id, next);
                                  notifySuccess(
                                    "Material swapped",
                                    `${a.alternative.name} is now in the shortlist.`,
                                  );
                                }}
                              >
                                {applied ? "Current selection" : "Swap in project"}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
