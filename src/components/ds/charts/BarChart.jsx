import React from "react";

/* Bar chart for periodic values. Negative bars take the negative semantic color automatically. */
export function BarChart({ data = [], labels = [], height = 180, tone = "accent", zeroLine = true, valueFormat = (v) => String(v), yTicks = 3, style, ...rest }) {
  if (!data.length) return null;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const W = 600;
  const H = height;
  const padL = 46;
  const padB = 20;
  const padT = 8;
  const plotW = W - padL - 8;
  const plotH = H - padB - padT;
  const slot = plotW / data.length;
  const bw = Math.max(2, Math.min(28, slot * 0.6));
  const y = (v) => padT + plotH - ((v - min) / span) * plotH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (span * i) / yTicks);
  const base = tone === "positive" ? "var(--data-positive)" : tone === "neutral" ? "var(--data-neutral)" : "var(--chart-series-1)";
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
      {data.map((v, i) => {
        const yy = Math.min(y(v), y(0));
        const hh = Math.max(1, Math.abs(y(v) - y(0)));
        return (
          <rect
            key={i}
            x={padL + i * slot + (slot - bw) / 2}
            y={yy}
            width={bw}
            height={hh}
            rx="1"
            fill={v < 0 ? "var(--data-negative)" : base}
          />
        );
      })}
      {zeroLine && min < 0 ? <line x1={padL} x2={W - 8} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" strokeWidth="1" /> : null}
      {labels.map((l, i) => (
        <text key={i} x={padL + i * slot + slot / 2} y={H - 6} textAnchor="middle" fill="var(--chart-axis)" fontFamily="var(--font-mono)" fontSize="9">
          {l}
        </text>
      ))}
    </svg>
  );
}
