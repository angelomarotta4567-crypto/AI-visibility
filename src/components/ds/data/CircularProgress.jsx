import React from "react";

/* Anello che si riempie -- alternativa alla ProgressBar lineare per processi
   lunghi (es. una misurazione da centinaia di chiamate), dove vedere il
   cerchio "chiudersi" comunica l'avanzamento in modo più immediato di una
   riga che striscia. */
export function CircularProgress({ value = 0, max = 100, size = 96, thickness = 8, tone = "accent", label, showValue = true, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const color = tone === "positive" ? "var(--data-positive)" : tone === "negative" ? "var(--data-negative)" : tone === "neutral" ? "var(--data-neutral)" : "var(--accent)";
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", ...style }} {...rest}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset var(--duration-slow) var(--ease-standard)" }}
          />
        </svg>
        {showValue ? (
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: "var(--weight-semibold)",
              fontSize: size >= 80 ? "var(--text-lg)" : "var(--text-sm)", color: "var(--text-primary)",
            }}
          >
            {pct.toFixed(0)}%
          </div>
        ) : null}
      </div>
      {label ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", textAlign: "center" }}>{label}</span> : null}
    </div>
  );
}
