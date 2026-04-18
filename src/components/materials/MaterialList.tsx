"use client";

import type { ProjectMaterial } from "@/types";
import { formatInr, formatKgCo2e } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function MaterialList({
  materials,
  onRemove,
  onQuantityChange,
}: {
  materials: ProjectMaterial[];
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  if (materials.length === 0) {
    return <p className="text-slate-600">No materials yet. Add lines below.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {materials.map((m) => (
        <li
          key={m.id}
          className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="font-medium">{m.materialName}</div>
            <div className="text-xs text-slate-500">
              {m.category} · {m.supplierName}
              {m.isEstimated && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 text-amber-900">
                  Estimated carbon
                </span>
              )}
            </div>
            <div className="mt-1 text-sm">
              {formatInr(m.totalCost)} · {formatKgCo2e(m.totalCarbon)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">
              Qty ({m.unit})
              <input
                type="number"
                min={0.001}
                step="any"
                className="ml-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                value={m.quantity}
                onChange={(e) => onQuantityChange(m.id, Number(e.target.value))}
              />
            </label>
            <Button variant="ghost" onClick={() => onRemove(m.id)}>
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
