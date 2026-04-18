import type { MaterialEntry, ProjectMaterial, SupplierOption } from "@/types";

function effectiveCarbon(s: SupplierOption): {
  value: number;
  isEstimated: boolean;
} {
  if (s.hasEPD) return { value: s.embodiedCarbon, isEstimated: false };
  if (s.estimatedCarbon)
    return { value: s.estimatedCarbon.value, isEstimated: true };
  return { value: s.embodiedCarbon, isEstimated: true };
}

export function buildProjectMaterial(
  material: MaterialEntry,
  quantity: number,
  supplierId?: string,
  lineId?: string,
): ProjectMaterial {
  const supplier =
    material.suppliers.find((s) => s.id === supplierId) ??
    material.suppliers[0];
  const { value: embodiedCarbon, isEstimated } = effectiveCarbon(supplier);
  const totalCost = quantity * supplier.unitPrice;
  const totalCarbon = quantity * embodiedCarbon;
  return {
    id: lineId ?? crypto.randomUUID(),
    materialId: material.id,
    materialName: material.name,
    category: material.category,
    selectedSupplierId: supplier.id,
    supplierName: supplier.name,
    quantity,
    unit: material.unit,
    unitPrice: supplier.unitPrice,
    embodiedCarbon,
    isEstimated,
    totalCost,
    totalCarbon,
  };
}
