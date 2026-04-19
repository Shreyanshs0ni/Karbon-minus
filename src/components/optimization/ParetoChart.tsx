"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import type { MaterialCombination } from "@/types";
import { formatInr, formatKgCo2e } from "@/lib/utils";

type Row = {
  id: string;
  totalCost: number;
  totalCarbon: number;
  feasible: boolean;
};

const axisTick = { fill: "currentColor" };

const MAX_SCATTER_POINTS = 400;

function buildChartRows(
  combinations: MaterialCombination[],
  paretoFrontier: MaterialCombination[],
): { rows: Row[]; frontierLine: { totalCost: number; totalCarbon: number }[] } {
  const feasible = combinations.filter((c) => c.isFeasible);
  const pool: MaterialCombination[] = [...feasible];
  for (const c of paretoFrontier) {
    if (!pool.some((x) => x.id === c.id)) pool.push(c);
  }
  const inPool = new Set(pool.map((c) => c.id));
  const rest = combinations.filter((c) => !inPool.has(c.id));
  const budget = Math.max(0, MAX_SCATTER_POINTS - pool.length);
  const step = Math.max(1, Math.ceil(rest.length / Math.max(1, budget)));
  for (let i = 0; i < rest.length && pool.length < MAX_SCATTER_POINTS; i += step) {
    pool.push(rest[i]!);
  }

  const rows: Row[] = pool.map((c) => ({
    id: c.id,
    totalCost: c.totalCost,
    totalCarbon: c.totalCarbon,
    feasible: c.isFeasible,
  }));

  const frontierLine = [...paretoFrontier]
    .sort((a, b) => a.totalCost - b.totalCost)
    .map((c) => ({
      totalCost: c.totalCost,
      totalCarbon: c.totalCarbon,
    }));

  return { rows, frontierLine };
}

export function ParetoChart({
  combinations,
  paretoFrontier,
  carbonBudget,
  costCeiling,
  selectedCombination,
  onSelectCombination,
}: {
  combinations: MaterialCombination[];
  paretoFrontier: MaterialCombination[];
  carbonBudget: number;
  costCeiling: number;
  selectedCombination: MaterialCombination | null;
  onSelectCombination: (c: MaterialCombination) => void;
}) {
  const { rows, frontierLine } = useMemo(
    () => buildChartRows(combinations, paretoFrontier),
    [combinations, paretoFrontier],
  );

  const feasibleRows = rows.filter((r) => r.feasible);
  const infeasRows = rows.filter((r) => !r.feasible);

  return (
    <div className="w-full text-foreground">
      <p className="mb-3 text-sm text-muted">
        Each point is one supplier mix across all lines.{" "}
        <span className="text-emerald-600 dark:text-emerald-400">Green</span> =
        meets both carbon budget and cost ceiling. Gray = outside one or both
        limits. Orange curve = Pareto frontier (best carbon for a given cost).
        Click a point to select it as your shortlist.
      </p>
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 16, right: 24, bottom: 48, left: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.6}
            />
            <XAxis
              type="number"
              dataKey="totalCost"
              domain={["dataMin", "dataMax"]}
              tick={axisTick}
              stroke="var(--border-strong)"
              tickFormatter={(v) => `₹${(Number(v) / 1e6).toFixed(1)}M`}
              label={{
                value: "Total cost (INR)",
                position: "bottom",
                offset: 12,
                fill: "var(--foreground)",
              }}
            />
            <YAxis
              type="number"
              dataKey="totalCarbon"
              domain={["dataMin", "dataMax"]}
              tick={axisTick}
              stroke="var(--border-strong)"
              tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
              label={{
                value: "Embodied carbon (kgCO₂e)",
                angle: -90,
                position: "insideLeft",
                fill: "var(--foreground)",
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Row;
                const full = combinations.find((c) => c.id === p.id);
                return (
                  <div className="rounded-lg border border-border bg-card p-3 text-xs text-foreground shadow-md">
                    <div className="font-medium">Mix {p.id}</div>
                    <div>{formatInr(p.totalCost)}</div>
                    <div>{formatKgCo2e(p.totalCarbon)}</div>
                    <div className="mt-1 text-subtle">
                      {p.feasible ? "Feasible" : "Infeasible"}
                    </div>
                    {full && (
                      <button
                        type="button"
                        className="mt-2 text-accent-muted underline"
                        onClick={() => onSelectCombination(full)}
                      >
                        Select shortlist
                      </button>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={carbonBudget}
              stroke="#059669"
              strokeDasharray="4 4"
              label={{
                value: "Carbon budget",
                fill: "#059669",
                position: "right",
              }}
            />
            <ReferenceLine
              x={costCeiling}
              stroke="#2563eb"
              strokeDasharray="4 4"
              label={{
                value: "Cost ceiling",
                fill: "#2563eb",
                position: "top",
              }}
            />
            <Scatter
              name="Infeasible"
              data={infeasRows}
              fill="#94a3b8"
              onClick={(d) => {
                const row = d as unknown as Row | undefined;
                if (!row?.id) return;
                const c = combinations.find((x) => x.id === row.id);
                if (c) onSelectCombination(c);
              }}
            />
            <Scatter
              name="Feasible"
              data={feasibleRows}
              fill="#10b981"
              onClick={(d) => {
                const row = d as unknown as Row | undefined;
                if (!row?.id) return;
                const c = combinations.find((x) => x.id === row.id);
                if (c) onSelectCombination(c);
              }}
            />
            <Line
              name="Pareto frontier"
              data={frontierLine}
              dataKey="totalCarbon"
              stroke="#d97706"
              strokeWidth={2}
              dot={false}
              type="monotone"
              legendType="line"
            />
            {selectedCombination && (
              <ReferenceLine
                x={selectedCombination.totalCost}
                stroke="#dc2626"
                strokeWidth={2}
                label={{ value: "Selected", fill: "#dc2626" }}
              />
            )}
            <Legend wrapperStyle={{ color: "var(--foreground)" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-subtle">
        Fewer points may be shown when there are many combinations, to keep the
        chart readable.
      </p>
    </div>
  );
}
