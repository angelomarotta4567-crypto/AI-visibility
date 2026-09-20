import React from "react";
import { Delta } from "./Delta.jsx";

/* A single KPI: small grey label, large monospace figure, signed delta and optional comparison note. */
export function Metric({ label, value, unit, delta, deltaUnit = "%", note, inverted = false, align = "left", size = "md", children, style, ...rest }) {
  const figure = size === "lg" ? "var(--text-3xl)" : size === "sm" ? "var(--text-xl)" : "var(--text-2xl)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: align === "right" ? "flex-end" : "flex-start", ...style }} {...rest}>
      <span style={{ fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
        {label}
      </span>
      <span style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: figure, fontWeight: "var(--weight-medium)", lineHeight: "var(--leading-tight)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {value}
        </span>
        {unit ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{unit}</span> : null}
        {delta != null ? <Delta value={delta} unit={deltaUnit} inverted={inverted} /> : null}
      </span>
      {note ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{note}</span> : null}
      {children}
    </div>
  );
}
