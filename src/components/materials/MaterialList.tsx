"use client";

import type { ProjectMaterial } from "@/types";
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
    return <p className="text-muted">No materials yet. Add lines below.</p>;
  }

  return (
    <ul className="divide-y divide-divide">
      {materials.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <div>
            <div className="font-medium text-foreground">{m.materialName}</div>
            <div className="text-xs text-subtle">
              {m.supplierName} · {m.unitPrice} INR / {m.unit}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-subtle">
              Qty
              <input
                type="number"
                min={0.001}
                step="any"
                value={m.quantity}
                onChange={(e) => onQuantityChange(m.id, Number(e.target.value))}
                className="ml-1 w-24 rounded border border-border bg-input-bg px-2 py-1 text-foreground"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onRemove(m.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
