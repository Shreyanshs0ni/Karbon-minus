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

const ACCENT = "#17CF97";
const FEASIBLE = "#17CF97";
const INFEASIBLE = "rgba(255,255,255,0.28)";
const FRONTIER = "#ff9f43";
const SELECTED = "#38bdf8";
const GRID = "rgba(255,255,255,0.08)";

const MAX_SCATTER_POINTS = 400;

function buildChartRows(
  combinations: MaterialCombination[],
  paretoFrontier: MaterialCombination[],
  selectedId: string | null,
): {
  rows: Row[];
  frontierLine: { totalCost: number; totalCarbon: number }[];
  selectedRow: Row | null;
} {
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

  const selectedCombo = selectedId
    ? combinations.find((c) => c.id === selectedId)
    : null;
  const poolIds = new Set(pool.map((p) => p.id));
  if (selectedCombo && !poolIds.has(selectedCombo.id)) {
    pool.push(selectedCombo);
  }

  const skip = new Set<string>();
  if (selectedId) skip.add(selectedId);

  const rows: Row[] = pool
    .filter((c) => !skip.has(c.id))
    .map((c) => ({
      id: c.id,
      totalCost: c.totalCost,
      totalCarbon: c.totalCarbon,
      feasible: c.isFeasible,
    }));

  const selectedRow: Row | null = selectedCombo
    ? {
        id: selectedCombo.id,
        totalCost: selectedCombo.totalCost,
        totalCarbon: selectedCombo.totalCarbon,
        feasible: selectedCombo.isFeasible,
      }
    : null;

  const frontierLine = [...paretoFrontier]
    .sort((a, b) => a.totalCost - b.totalCost)
    .map((c) => ({
      totalCost: c.totalCost,
      totalCarbon: c.totalCarbon,
    }));

  return { rows, frontierLine, selectedRow };
}

export function ParetoChart({
  combinations,
  paretoFrontier,
  carbonBudget,
  costCeiling,
  baseline,
  selectedCombination,
  onSelectCombination,
}: {
  combinations: MaterialCombination[];
  paretoFrontier: MaterialCombination[];
  carbonBudget: number;
  costCeiling: number;
  baseline: MaterialCombination | null;
  selectedCombination: MaterialCombination | null;
  onSelectCombination: (c: MaterialCombination) => void;
}) {
  const selectedId = selectedCombination?.id ?? null;

  const { rows, frontierLine, selectedRow } = useMemo(
    () => buildChartRows(combinations, paretoFrontier, selectedId),
    [combinations, paretoFrontier, selectedId],
  );

  const feasibleRows = rows.filter((r) => r.feasible);
  const infeasRows = rows.filter((r) => !r.feasible);

  return (
    <div className="w-full text-white">
      {/* Intro copy — plain language */}
      <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/75 backdrop-blur-sm">
        <p className="font-medium text-white">What you are looking at</p>
        <p className="mt-1">
          Each dot is one possible way to assign suppliers to your materials.
          <span className="text-[#17CF97]"> Teal dots</span> fit both your money
          limit and carbon goal. Pale dots do not. The{" "}
          <span className="text-[#ff9f43]">orange curve</span> connects the best
          “cheap vs clean” tradeoffs.{" "}
          <span className="text-[#38bdf8]">Blue</span> is the plan you selected.
        </p>
        <p className="mt-2 text-xs text-white/55">
          Tip: toward the bottom-left is usually better — less cost and less
          carbon.
        </p>
      </div>

      {/* Axis titles outside the chart so they stay centered and readable */}
      <div className="flex gap-2 sm:gap-3">
        <div className="flex w-11 shrink-0 flex-col justify-center sm:w-14">
          <p
            className="text-center text-[11px] font-semibold leading-snug tracking-wide text-white/80 sm:text-xs"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Carbon footprint (kg CO₂e) — lower is better
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-white/[0.08] bg-[#102235]/70 p-3 shadow-[0_0_40px_-12px_rgba(23,207,151,0.25)] backdrop-blur-md">
            <div className="h-[min(420px,72vh)] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  margin={{ top: 12, right: 8, bottom: 8, left: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID}
                    opacity={0.9}
                  />
                  <XAxis
                    type="number"
                    dataKey="totalCost"
                    domain={["dataMin", "dataMax"]}
                    tick={{
                      fill: "rgba(255,255,255,0.72)",
                      fontSize: 11,
                    }}
                    stroke={GRID}
                    tickFormatter={(v) => `₹${(Number(v) / 1e6).toFixed(1)}M`}
                  />
                  <YAxis
                    type="number"
                    dataKey="totalCarbon"
                    domain={["dataMin", "dataMax"]}
                    tick={{
                      fill: "rgba(255,255,255,0.72)",
                      fontSize: 11,
                    }}
                    stroke={GRID}
                    width={52}
                    tickFormatter={(v) =>
                      `${(Number(v) / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    cursor={{
                      strokeDasharray: "4 4",
                      stroke: `${ACCENT}88`,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as Row;
                      const full = combinations.find((c) => c.id === p.id);
                      let costVs = "";
                      let carbVs = "";
                      if (full && baseline && baseline.totalCost > 0) {
                        const cp =
                          ((full.totalCost - baseline.totalCost) /
                            baseline.totalCost) *
                          100;
                        costVs =
                          cp <= 0
                            ? `Price ${Math.abs(cp).toFixed(1)}% lower than starting mix`
                            : `Price ${cp.toFixed(1)}% higher than starting mix`;
                      }
                      if (full && baseline && baseline.totalCarbon > 0) {
                        const kp =
                          ((baseline.totalCarbon - full.totalCarbon) /
                            baseline.totalCarbon) *
                          100;
                        carbVs =
                          kp >= 0
                            ? `Carbon ${kp.toFixed(1)}% lower than starting mix`
                            : `Carbon ${Math.abs(kp).toFixed(1)}% higher than starting mix`;
                      }
                      return (
                        <div
                          className="max-w-[260px] rounded-xl border px-3 py-2.5 text-xs shadow-xl backdrop-blur-md"
                          style={{
                            background: "rgba(12,28,43,0.96)",
                            borderColor: "rgba(255,255,255,0.12)",
                          }}
                        >
                          <p className="font-semibold text-[#17CF97]">
                            Option {p.id}
                          </p>
                          <p className="mt-1 text-white/90">
                            <span className="text-white/55">Total price: </span>
                            {formatInr(p.totalCost)}
                          </p>
                          <p className="text-white/90">
                            <span className="text-white/55">Carbon: </span>
                            {formatKgCo2e(p.totalCarbon)}
                          </p>
                          {(costVs || carbVs) && (
                            <div className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/65">
                              {costVs && <p>{costVs}</p>}
                              {carbVs && <p>{carbVs}</p>}
                            </div>
                          )}
                          <p className="mt-2 text-[11px]">
                            {p.feasible ? (
                              <span className="text-[#17CF97]">
                                ✓ Within your budget and carbon limits
                              </span>
                            ) : (
                              <span className="text-[#ffcb45]">
                                Outside one or both limits (still selectable)
                              </span>
                            )}
                          </p>
                          {full && (
                            <button
                              type="button"
                              className="mt-2 w-full rounded-lg bg-[#17CF97] py-1.5 text-[11px] font-semibold text-[#06131d] transition hover:brightness-110"
                              onClick={() => onSelectCombination(full)}
                            >
                              Use this supplier mix
                            </button>
                          )}
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={carbonBudget}
                    stroke={ACCENT}
                    strokeDasharray="5 5"
                    strokeOpacity={0.75}
                    label={{
                      value: "Your carbon limit",
                      fill: ACCENT,
                      position: "right",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    x={costCeiling}
                    stroke="rgba(23,207,151,0.45)"
                    strokeDasharray="5 5"
                    label={{
                      value: "Your budget limit",
                      fill: "rgba(255,255,255,0.65)",
                      position: "top",
                      fontSize: 10,
                    }}
                  />
                  <Scatter
                    name="Other options (off limits)"
                    data={infeasRows}
                    fill={INFEASIBLE}
                    isAnimationActive
                    animationDuration={500}
                    onClick={(d) => {
                      const row = d as unknown as Row | undefined;
                      if (!row?.id) return;
                      const c = combinations.find((x) => x.id === row.id);
                      if (c) onSelectCombination(c);
                    }}
                  />
                  <Scatter
                    name="Good options (in range)"
                    data={feasibleRows}
                    fill={FEASIBLE}
                    isAnimationActive
                    animationDuration={500}
                    onClick={(d) => {
                      const row = d as unknown as Row | undefined;
                      if (!row?.id) return;
                      const c = combinations.find((x) => x.id === row.id);
                      if (c) onSelectCombination(c);
                    }}
                  />
                  <Line
                    name="Best tradeoff curve"
                    data={frontierLine}
                    dataKey="totalCarbon"
                    stroke={FRONTIER}
                    strokeWidth={2.5}
                    dot={false}
                    type="monotone"
                    legendType="line"
                    isAnimationActive
                    animationDuration={700}
                  />
                  {selectedRow && (
                    <Scatter
                      name="Your selection"
                      data={[selectedRow]}
                      fill={SELECTED}
                      legendType="circle"
                      isAnimationActive
                      animationDuration={350}
                      shape={(props: { cx?: number; cy?: number }) => {
                        const { cx, cy } = props;
                        if (cx == null || cy == null) return null;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={10}
                            fill={SELECTED}
                            stroke="#fff"
                            strokeWidth={2}
                            style={{
                              filter:
                                "drop-shadow(0 0 10px rgba(56,189,248,0.55))",
                            }}
                          />
                        );
                      }}
                    />
                  )}
                  <Legend
                    wrapperStyle={{
                      paddingTop: 12,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* X-axis title centered under plot */}
            <p className="mt-2 px-2 text-center text-[11px] font-semibold leading-snug text-white/75 sm:text-xs">
              Total project cost (INR) — lower is usually cheaper for the same
              scope
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-white/45">
        If you have many combinations, we sample dots so the chart stays easy to
        read. Your selection is always shown.
      </p>
    </div>
  );
}
