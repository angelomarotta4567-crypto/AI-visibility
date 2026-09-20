import React from "react";

/* Minimal line chart: horizontal gridlines, monospace axis labels, one or two series. No legend chrome, no shadows. */
export function LineChart({
  series = [],
  labels = [],
  height = 200,
  yTicks = 4,
  area = true,
  valueFormat = (v) => String(v),
  style,
  ...rest
}) {
  const sets = series.map((s) => (Array.isArray(s) ? { data: s } : s));
  const all = sets.flatMap((s) => s.data);
  if (!all.length) return null;
  const min = Math.min(0, ...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const padL = 46;
  const padB = 20;
  const padT = 8;
  const W = 600;
  const H = height;
  const plotW = W - padL - 8;
  const plotH = H - padB - padT;
  const x = (i, n) => padL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v) => padT + plotH - ((v - min) / span) * plotH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (span * i) / yTicks);
  const palette = ["var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)"];

  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", ...style }} {...rest}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" fill="var(--chart-axis)" fontFamily="var(--font-mono)" fontSize="9">
            {valueFormat(t)}
          </text>
        </g>
      ))}
      {sets.map((s, si) => {
        const color = s.color || palette[si % palette.length];
        const n = s.data.length;
        const d = s.data.map((v, i) => (i ? "L" : "M") + x(i, n).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
        return (
          <g key={si}>
            {area && si === 0 ? <path d={d + " L" + x(n - 1, n) + " " + (padT + plotH) + " L" + padL + " " + (padT + plotH) + " Z"} fill={color} opacity="0.12" /> : null}
            <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={s.dashed ? "4 3" : undefined} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {labels.map((l, i) =>
        i % Math.ceil(labels.length / 8) === 0 ? (
          <text key={i} x={x(i, labels.length)} y={H - 6} textAnchor="middle" fill="var(--chart-axis)" fontFamily="var(--font-mono)" fontSize="9">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}
