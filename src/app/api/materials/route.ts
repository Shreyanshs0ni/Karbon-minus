import { NextRequest, NextResponse } from "next/server";
import { getAllMaterials } from "@/lib/db";
import type { MaterialCategory } from "@/types";

export const dynamic = "force-dynamic";

function supplierMinPrice(m: { suppliers: { unitPrice: number }[] }) {
  return Math.min(...m.suppliers.map((s) => s.unitPrice));
}

function supplierMinCarbon(m: {
  suppliers: { embodiedCarbon: number; estimatedCarbon?: { value: number } }[];
}) {
  return Math.min(
    ...m.suppliers.map((s) =>
      s.estimatedCarbon ? s.estimatedCarbon.value : s.embodiedCarbon,
    ),
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MaterialCategory | null;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minCarbon = searchParams.get("minCarbon");
  const maxCarbon = searchParams.get("maxCarbon");
  const sort = searchParams.get("sort") ?? "name";
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  let list = getAllMaterials();

  if (category && (category as string) !== "all") {
    list = list.filter((m) => m.category === category);
  }

  const minP = minPrice ? Number(minPrice) : undefined;
  const maxP = maxPrice ? Number(maxPrice) : undefined;
  const minC = minCarbon ? Number(minCarbon) : undefined;
  const maxC = maxCarbon ? Number(maxCarbon) : undefined;

  list = list.filter((m) => {
    const prices = m.suppliers.map((s) => s.unitPrice);
    const carbons = m.suppliers.map((s) =>
      s.estimatedCarbon ? s.estimatedCarbon.value : s.embodiedCarbon,
    );
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const cMin = Math.min(...carbons);
    const cMax = Math.max(...carbons);
    if (minP !== undefined && !Number.isNaN(minP) && pMax < minP) return false;
    if (maxP !== undefined && !Number.isNaN(maxP) && pMin > maxP) return false;
    if (minC !== undefined && !Number.isNaN(minC) && cMax < minC) return false;
    if (maxC !== undefined && !Number.isNaN(maxC) && cMin > maxC) return false;
    return true;
  });

  const mul = order === "asc" ? 1 : -1;
  list = [...list].sort((a, b) => {
    if (sort === "price")
      return (supplierMinPrice(a) - supplierMinPrice(b)) * mul;
    if (sort === "carbon")
      return (supplierMinCarbon(a) - supplierMinCarbon(b)) * mul;
    return a.name.localeCompare(b.name) * mul;
  });

  return NextResponse.json({ materials: list });
}
