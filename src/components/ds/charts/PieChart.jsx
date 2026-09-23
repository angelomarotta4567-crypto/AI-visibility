import React from "react";

const DEFAULT_COLORS = ["var(--data-negative)", "var(--data-warning)", "var(--data-neutral)", "var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)"];

/* Grafico a torta (donut) per composizioni con poche fette -- es. quanto
   pesa ogni problema di diagnosi sul punteggio mancante. slices: [{ label,
   value, color? }]. Nessuna fetta se value totale è 0. */
export function PieChart({ slices = [], size = 140, thickness = 26, style, ...rest }) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = total > 0
    ? slices
        .filter((s) => s.value > 0)
        .map((s, i) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return { ...s, dash, gap, offset, color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
        })
    : [];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap", ...style }} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flex: "none" }}>
        {total === 0 ? (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        ) : (
          segments.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
            />
          ))
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 160 }}>
        {segments.length === 0 ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Nessun dato</span>
        ) : (
          segments.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flex: "none" }} />
              <span style={{ color: "var(--text-primary)", flex: 1 }}>{s.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
