"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

/** Baseline vs current — same pair on cost and carbon before/after charts */
const REPORT_BAR_BEFORE = "#64748b";
const REPORT_BAR_AFTER = "#059669";

export function BeforeAfterCostChart(props: {
  baselineCost: number;
  currentCost: number;
}) {
  const data = [
    { label: "Baseline (creation)", value: props.baselineCost },
    { label: "Current shortlist", value: props.currentCost },
  ];

  return (
    <div className="h-64 w-full">
      <p className="mb-2 text-center text-xs font-medium text-muted">
        Cost — before vs after (INR)
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            interval={0}
          />
          <YAxis
            tick={{ fill: "var(--foreground)" }}
            tickFormatter={(v) => `₹${(Number(v) / 1e6).toFixed(2)}M`}
            label={{
              value: "INR (M); tooltips show full amount",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted)",
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
            formatter={(v) => [
              `₹${Math.round(Number(v ?? 0)).toLocaleString("en-IN")}`,
              "Amount",
            ]}
          />
          <Bar dataKey="value" name="INR" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? REPORT_BAR_BEFORE : REPORT_BAR_AFTER}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BeforeAfterCarbonChart(props: {
  baselineCarbon: number;
  currentCarbon: number;
}) {
  const data = [
    { label: "Baseline (creation)", value: props.baselineCarbon / 1000 },
    { label: "Current shortlist", value: props.currentCarbon / 1000 },
  ];

  return (
    <div className="h-64 w-full">
      <p className="mb-2 text-center text-xs font-medium text-muted">
        Embodied carbon — before vs after (tonnes CO₂e)
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            interval={0}
          />
          <YAxis
            tick={{ fill: "var(--foreground)" }}
            tickFormatter={(v) => `${Number(v).toFixed(1)} t`}
            label={{
              value: "tonnes CO₂e",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted)",
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
            formatter={(v) => {
              const kg = Number(v ?? 0) * 1000;
              return [
                `${Math.round(kg).toLocaleString("en-IN")} kgCO₂e`,
                "Carbon",
              ];
            }}
          />
          <Bar dataKey="value" name="t CO₂e" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? REPORT_BAR_BEFORE : REPORT_BAR_AFTER}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetUtilizationChart(props: {
  label: string;
  actual: number;
  limit: number;
  formatActual: (n: number) => string;
  formatLimit: (n: number) => string;
}) {
  const { limit, actual } = props;

  if (limit <= 0) {
    return (
      <div className="w-full min-w-[200px] max-w-sm">
        <p className="mb-1 text-xs font-medium text-muted">{props.label}</p>
        <p className="text-sm text-muted">
          Set a positive limit in project settings to see utilization.
        </p>
        <p className="mt-1 text-xs text-subtle">
          Actual: {props.formatActual(actual)}
        </p>
      </div>
    );
  }

  const ratio = actual / limit;
  const rawPct = ratio * 100;
  const greenFlex = Math.min(ratio, 1);
  const redFlex = Math.max(0, ratio - 1);
  const grayFlex = Math.max(0, 1 - ratio);
  const variance = actual - limit;

  return (
    <div className="w-full min-w-[200px] max-w-sm">
      <p className="mb-1 text-xs font-medium text-muted">{props.label}</p>
      <div className="flex h-9 w-full overflow-hidden rounded-md border border-border bg-muted/50">
        {greenFlex > 0 && (
          <div
            className="min-h-0 bg-emerald-500 transition-all"
            style={{ flex: greenFlex }}
            title="Within limit"
          />
        )}
        {redFlex > 0 && (
          <div
            className="min-h-0 bg-red-500 transition-all"
            style={{ flex: redFlex }}
            title="Over limit"
          />
        )}
        {grayFlex > 0 && (
          <div
            className="min-h-0 bg-border/80 transition-all"
            style={{ flex: grayFlex }}
            title="Headroom"
          />
        )}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-muted">
        <p>
          <span className="text-foreground">Actual:</span>{" "}
          {props.formatActual(actual)}
        </p>
        <p>
          <span className="text-foreground">Limit:</span>{" "}
          {props.formatLimit(limit)}
        </p>
        <p className={variance > 0 ? "text-red-600 dark:text-red-400" : ""}>
          <span className="text-foreground">Share of limit:</span>{" "}
          {rawPct.toFixed(1)}%
          {variance > 0 && (
            <span> ({props.formatActual(variance)} over)</span>
          )}
          {variance < 0 && (
            <span> ({props.formatActual(-variance)} under)</span>
          )}
        </p>
      </div>
      <p className="mt-1 text-[10px] text-subtle">
        Green = within limit; red = over limit; gray = unused headroom.
      </p>
    </div>
  );
}

export function CategoryCarbonPie(props: {
  breakdown: Array<{ category: string; carbon: number; percentage: number }>;
}) {
  const data = props.breakdown
    .filter((c) => c.carbon > 0)
    .map((c) => ({ name: c.category, value: c.carbon }));

  if (data.length === 0) return null;

  return (
    <div className="h-64 w-full">
      <p className="mb-2 text-center text-xs font-medium text-muted">
        Embodied carbon share by category
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [
              `${Math.round(Number(v ?? 0)).toLocaleString()} kgCO₂e`,
              "Carbon",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
