"use client";

import { useState } from "react";
import type { MaterialEntry } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildProjectMaterial } from "@/lib/materials";

export function MaterialInput({
  onAdd,
  existingMaterialIds,
}: {
  onAdd: (pm: ReturnType<typeof buildProjectMaterial>) => void;
  existingMaterialIds: string[];
}) {
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<
    Array<{
      material: MaterialEntry;
      confidenceScore: number;
      matchReason: string;
    }>
  >([]);
  const [picked, setPicked] = useState<MaterialEntry | null>(null);
  const [quantity, setQuantity] = useState("1000");
  const [supplierId, setSupplierId] = useState<string>("");

  async function interpret() {
    setLoading(true);
    setMatches([]);
    setPicked(null);
    try {
      const res = await fetch("/api/materials/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          projectContext: { existingMaterials: existingMaterialIds },
        }),
      });
      const data = await res.json();
      setMatches(data.matches ?? []);
    } finally {
      setLoading(false);
    }
  }

  function confirmAdd() {
    if (!picked) return;
    const q = Number(quantity);
    if (!(q > 0)) return;
    const sup =
      picked.suppliers.find((s) => s.id === supplierId) ?? picked.suppliers[0];
    const pm = buildProjectMaterial(picked, q, sup.id);
    onAdd(pm);
    setPicked(null);
    setDesc("");
    setMatches([]);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Describe a material (natural language)
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <Input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. TMT bars for columns, OPC cement bulk"
            className="min-w-[200px] flex-1"
          />
          <Button
            type="button"
            disabled={loading || !desc.trim()}
            onClick={() => void interpret()}
          >
            {loading ? "…" : "Interpret"}
          </Button>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-sm font-medium">Matches</div>
          <ul className="mt-2 space-y-2">
            {matches.map((m) => (
              <li key={m.material.id}>
                <button
                  type="button"
                  className="w-full rounded border border-transparent px-2 py-2 text-left hover:border-emerald-300 hover:bg-white"
                  onClick={() => {
                    setPicked(m.material);
                    setSupplierId(m.material.suppliers[0]?.id ?? "");
                  }}
                >
                  <div className="font-medium">{m.material.name}</div>
                  <div className="text-xs text-slate-600">
                    {(m.confidenceScore * 100).toFixed(0)}% — {m.matchReason}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {picked && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="font-medium">{picked.name}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-600">
                Quantity ({picked.unit})
              </label>
              <Input
                type="number"
                min={0.001}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Supplier</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {picked.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.unitPrice} INR / {picked.unit}
                    {!s.hasEPD ? " (no EPD)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button className="mt-3" type="button" onClick={confirmAdd}>
            Add to project
          </Button>
        </div>
      )}
    </div>
  );
}
