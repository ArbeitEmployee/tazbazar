"use client";

import React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CHART_COLORS = [
  "#111827",
  "#2563eb",
  "#059669",
  "#d97706",
  "#e11d48",
  "#7c3aed",
  "#0f766e",
  "#64748b",
];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 12,
};

export function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`app-panel p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {action || null}
      </div>
      {children}
    </div>
  );
}

export function ChartEmpty({ message = "Not enough data to draw this chart yet." }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl bg-gray-50 px-4 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function hasPositiveValues(rows, keys) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) =>
    keys.some((key) => Number(row?.[key] || 0) > 0),
  );
}

// Revenue (area, left axis) + orders (bars, right axis) over time.
export function TrendChart({ data }) {
  const rows = Array.isArray(data) ? data : [];
  if (!hasPositiveValues(rows, ["revenue", "orders"])) {
    return <ChartEmpty />;
  }
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval="preserveStartEnd" />
          <YAxis yAxisId="revenue" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => (name === "Revenue (Tk)" ? `${Number(value || 0).toFixed(2)} Tk` : value)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue (Tk)" stroke="#111827" strokeWidth={2.5} fill="#111827" fillOpacity={0.08} />
          <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={14} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Named slices: [{ name, value }]
export function DonutChart({ data, height = 260 }) {
  const rows = (Array.isArray(data) ? data : []).filter(
    (entry) => Number(entry?.value || 0) > 0,
  );
  if (rows.length === 0) {
    return <ChartEmpty />;
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
            {rows.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Named bars: [{ name, value }]
export function MiniBarChart({ data, height = 260, color = "#111827" }) {
  const rows = (Array.isArray(data) ? data : []).filter(
    (entry) => Number(entry?.value || 0) !== 0,
  );
  if (rows.length === 0) {
    return <ChartEmpty />;
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value || 0).toFixed(2)} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={18}>
            {rows.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
