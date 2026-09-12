"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TopSellingSlice } from "@/types/dashboardStats";

const DEFAULT_COLORS = ["#0ea5e9", "#1d4ed8", "#38bdf8", "#0284c7", "#7dd3fc"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  const percent = total ? ((slice.value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{slice.payload.name}</p>
      <p className="mt-0.5 text-ink/60">
        {formatNumber(slice.value)} units · {percent}%
      </p>
    </div>
  );
}

export function TopSellingPieChart({ data }: { data: TopSellingSlice[] }) {
  const total = useMemo(() => data.reduce((sum, slice) => sum + slice.value, 0), [data]);

  const legendItems = useMemo(
    () =>
      data.map((slice, index) => ({
        name: slice.name,
        value: slice.value,
        color: slice.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        percent: total ? Math.round((slice.value / total) * 100) : 0,
      })),
    [data, total]
  );

  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Top selling devices</h3>
        <span className="text-xs text-ink/40">By quantity sold</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Donut: fixed, comfortable size — never shrinks past legibility */}
        <div className="relative h-[168px] w-[168px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                stroke="var(--paper, #fff)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((slice, index) => (
                  <Cell
                    key={slice.name + index}
                    fill={slice.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold leading-none text-ink">
              {formatNumber(total)}
            </span>
            <span className="mt-1 text-[11px] text-ink/50">units sold</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5 self-stretch overflow-y-auto sm:max-h-[168px]">
          {legendItems.map((item) => (
            <li key={item.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 flex-1 truncate text-ink/80" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums font-medium text-ink">{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}