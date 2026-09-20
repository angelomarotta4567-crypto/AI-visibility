import React from "react";

/* Inline trend line for table cells and metric tiles. Colored by direction, no axes, no labels. */
export function Sparkline({ data = [], width = 96, height = 24, tone, strokeWidth = 1.25, area = false, style, ...rest }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 2) - 1]);
  const dir = data[data.length - 1] - data[0];
  const color = tone === "accent" ? "var(--chart-series-1)" : tone === "neutral" ? "var(--data-neutral)" : dir >= 0 ? "var(--data-positive)" : "var(--data-negative)";
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg width={width} height={height} viewBox={"0 0 " + width + " " + height} style={{ display: "block", overflow: "visible", ...style }} {...rest}>
      {area ? <path d={line + " L" + width + " " + height + " L0 " + height + " Z"} fill={color} opacity="0.12" /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
