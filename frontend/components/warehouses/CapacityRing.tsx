"use client";

import { PieChart, Pie, Cell } from "recharts";

interface CapacityRingProps {
  used: number;
  capacity: number;
  size?: number;
  thickness?: number;
}

export function CapacityRing({
  used,
  capacity,
  size = 56,
  thickness = 7,
}: CapacityRingProps) {
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  const remaining = Math.max(0, 100 - pct);

  const color = pct >= 90 ? "#b5502f" : pct >= 65 ? "#8a9a5b" : "#33502f";

  const data = [
    { value: pct, fill: color },
    { value: remaining, fill: "#e7e2d6" },
  ];

  const radius = size / 2;
  const inner = radius - thickness;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={inner}
          outerRadius={radius}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-ink tabular-nums"
          style={{ fontSize: size <= 40 ? "9px" : "11px" }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}