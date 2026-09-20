import React from "react";

/* Thin quantitative bar for shares, quotas and pipeline fill. No gradient, no shine. */
export function ProgressBar({ value = 0, max = 100, tone = "accent", label, showValue = true, height = 4, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === "positive" ? "var(--data-positive)" : tone === "negative" ? "var(--data-negative)" : tone === "neutral" ? "var(--data-neutral)" : "var(--accent)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: "100%", ...style }} {...rest}>
      {label || showValue ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)" }}>
          {label ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{label}</span> : <span />}
          {showValue ? (
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
              {pct.toFixed(0)}%
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ height: height, background: "var(--surface-3)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, transition: "width var(--duration-slow) var(--ease-standard)" }} />
      </div>
    </div>
  );
}
