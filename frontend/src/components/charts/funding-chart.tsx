"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface FundingChartProps {
  financed: number;
  unfinanced: number;
}

const COLORS = ["#a3e635", "#39493f"];

export function FundingChart({ financed, unfinanced }: FundingChartProps) {
  const data = [
    { name: "financed", value: financed },
    { name: "not yet financed", value: unfinanced },
  ];

  return (
    <div className="relative h-40 w-40 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={data.every((d) => d.value === 0) ? 0 : 2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#101512",
              border: "1px solid #39493f",
              borderRadius: 0,
              fontSize: 12,
              color: "#eef2ef",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold accent-text">{financed}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">financed</span>
      </div>
    </div>
  );
}
