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
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 12 },
  h2: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1 },
  muted: { color: "#555" },
});

export type ProcurementPdfProps = {
  project: Project;
  materials: ProjectMaterial[];
  executiveSummary: string;
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
        <Text style={styles.title}>Procurement summary</Text>
        <Text style={styles.muted}>{props.project.name}</Text>
        <Text style={{ marginTop: 8 }}>
          Carbon budget: {props.project.carbonBudget.toLocaleString()} kgCO2e ·
          Cost ceiling: INR {props.project.costCeiling.toLocaleString()}
        </Text>
        <Text style={styles.h2}>Executive summary</Text>
        <Text>{props.executiveSummary}</Text>
        <Text style={styles.h2}>Totals</Text>
        <Text>
          Total cost: INR {Math.round(props.totalCost).toLocaleString()}
        </Text>
        <Text>
          Total embodied carbon:{" "}
          {Math.round(props.totalCarbon).toLocaleString()} kgCO2e
        </Text>
        <Text>
          Per m² (area {props.assumedArea} m²): INR{" "}
          {Math.round(props.costPerSqm).toLocaleString()} ·{" "}
          {props.carbonPerSqm.toFixed(2)} kgCO2e/m²
        </Text>
        <Text style={styles.h2}>Carbon by category</Text>
        {props.categoryBreakdown.map((c) => (
          <View key={c.category} style={styles.row}>
            <Text style={styles.cell}>{c.category}</Text>
            <Text style={styles.cell}>{c.percentage.toFixed(1)}%</Text>
            <Text style={styles.cell}>
              {Math.round(c.carbon).toLocaleString()} kgCO2e
            </Text>
          </View>
        ))}
        <Text style={styles.h2}>Materials</Text>
        {props.materials.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{m.materialName}</Text>
            <Text style={styles.cell}>{m.supplierName}</Text>
            <Text style={styles.cell}>{String(m.quantity)}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 24, fontSize: 9, color: "#888" }} fixed>
          Figures may include estimates where EPD data is unavailable.
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
