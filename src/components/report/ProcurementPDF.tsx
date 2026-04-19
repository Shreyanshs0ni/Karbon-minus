"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { Project, ProjectMaterial } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8 },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 6, fontWeight: "bold" },
  row: { flexDirection: "row", marginBottom: 3 },
  cell: { flex: 1, paddingRight: 4 },
  muted: { color: "#555" },
  highlight: {
    backgroundColor: "#ecfdf5",
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  tableHeader: { fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#ccc" },
});

export type ProcurementPdfProps = {
  project: Project;
  materials: ProjectMaterial[];
  executiveSummary: string;
  baselineCost: number;
  baselineCarbon: number;
  currentCost: number;
  currentCarbon: number;
  costSavings: number;
  carbonSavings: number;
  totalCost: number;
  totalCarbon: number;
  categoryBreakdown: Array<{
    category: string;
    cost: number;
    carbon: number;
    percentage: number;
  }>;
  costPerSqm: number;
  carbonPerSqm: number;
  assumedArea: number;
};

export function buildProcurementDocument(props: ProcurementPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Embodied carbon procurement report</Text>
        <Text style={styles.muted}>{props.project.name}</Text>
        <Text style={{ marginTop: 8, fontSize: 9 }}>
          Carbon budget:{" "}
          {props.project.carbonBudget.toLocaleString("en-IN")} kgCO₂e · Cost
          ceiling: INR {props.project.costCeiling.toLocaleString("en-IN")}
        </Text>

        <View style={styles.highlight}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
            Baseline (at project creation) → Current shortlist
          </Text>
          <Text>
            Cost: INR {Math.round(props.baselineCost).toLocaleString("en-IN")}{" "}
            → INR {Math.round(props.currentCost).toLocaleString("en-IN")}
            {props.costSavings > 0
              ? ` (savings INR ${Math.round(props.costSavings).toLocaleString("en-IN")})`
              : ""}
          </Text>
          <Text>
            Embodied carbon:{" "}
            {Math.round(props.baselineCarbon).toLocaleString("en-IN")} →{" "}
            {Math.round(props.currentCarbon).toLocaleString("en-IN")} kgCO₂e
            {props.carbonSavings > 0
              ? ` (savings ${Math.round(props.carbonSavings).toLocaleString("en-IN")} kgCO₂e)`
              : ""}
          </Text>
        </View>

        <Text style={styles.h2}>Executive summary</Text>
        <Text>{props.executiveSummary}</Text>

        <Text style={styles.h2}>Totals (current)</Text>
        <Text>
          Total cost: INR{" "}
          {Math.round(props.totalCost).toLocaleString("en-IN")}
        </Text>
        <Text>
          Total embodied carbon:{" "}
          {Math.round(props.totalCarbon).toLocaleString("en-IN")} kgCO₂e
        </Text>
        <Text>
          Per m² (area {props.assumedArea} m²): INR{" "}
          {Math.round(props.costPerSqm).toLocaleString("en-IN")} ·{" "}
          {props.carbonPerSqm.toFixed(2)} kgCO₂e/m²
        </Text>

        <Text style={styles.h2}>Carbon by category</Text>
        {props.categoryBreakdown.map((c) => (
          <View key={c.category} style={styles.row}>
            <Text style={styles.cell}>{c.category}</Text>
            <Text style={styles.cell}>{c.percentage.toFixed(1)}%</Text>
            <Text style={styles.cell}>
              {Math.round(c.carbon).toLocaleString("en-IN")} kgCO₂e
            </Text>
          </View>
        ))}

        <Text style={styles.h2}>Line items (current)</Text>
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, { flex: 2 }]}>Material</Text>
          <Text style={styles.cell}>Supplier</Text>
          <Text style={styles.cell}>Qty</Text>
          <Text style={styles.cell}>Line CO₂e</Text>
        </View>
        {props.materials.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{m.materialName}</Text>
            <Text style={styles.cell}>{m.supplierName}</Text>
            <Text style={styles.cell}>
              {String(m.quantity)} {m.unit}
            </Text>
            <Text style={styles.cell}>
              {Math.round(m.totalCarbon).toLocaleString("en-IN")}
            </Text>
          </View>
        ))}
        <Text style={{ marginTop: 20, fontSize: 8, color: "#888" }} fixed>
          Figures may include estimates where EPD data is unavailable. Baseline
          totals are frozen at project creation.
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadProcurementPdf(props: ProcurementPdfProps) {
  const doc = buildProcurementDocument(props);
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `procurement-${props.project.name.replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
