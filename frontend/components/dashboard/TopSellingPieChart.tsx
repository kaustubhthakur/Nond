"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TopSellingSlice } from "@/types/dashboardStats";

const DEFAULT_COLORS = ["#0ea5e9", "#1d4ed8", "#38bdf8", "#0284c7"];

export function TopSellingPieChart({ data }: { data: TopSellingSlice[] }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-ink">Top Selling Devices</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
              {data.map((slice, index) => (
                <Cell key={slice.name} fill={slice.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={24} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}