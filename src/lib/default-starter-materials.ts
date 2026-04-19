/** One-click starter lines for empty projects — tune quantities to match typical orders. */
export const DEFAULT_STARTER_MATERIALS: Array<{
  materialId: string;
  defaultQty: number;
  label: string;
}> = [
  {
    materialId: "steel-001",
    defaultQty: 8000,
    label: "TMT rebar (starter batch)",
  },
  {
    materialId: "cement-001",
    defaultQty: 150000,
    label: "Portland cement",
  },
  {
    materialId: "insulation-001",
    defaultQty: 4000,
    label: "Wall insulation",
  },
];
