import type { ProjectMaterial } from "@/types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatKgCo2e(n: number): string {
  return `${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })} kgCO₂e`;
}

export function sumMaterialTotals(materials: ProjectMaterial[]): {
  totalCost: number;
  totalCarbon: number;
} {
  return materials.reduce(
    (a, m) => ({
      totalCost: a.totalCost + m.totalCost,
      totalCarbon: a.totalCarbon + m.totalCarbon,
    }),
    { totalCost: 0, totalCarbon: 0 },
  );
}
