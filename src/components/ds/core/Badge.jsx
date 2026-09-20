import React from "react";

const badgeTones = {
  positive: { fg: "var(--data-positive)", bg: "var(--data-positive-subtle)" },
  negative: { fg: "var(--data-negative)", bg: "var(--data-negative-subtle)" },
  warning: { fg: "var(--data-warning)", bg: "var(--data-warning-subtle)" },
  neutral: { fg: "var(--text-secondary)", bg: "var(--data-neutral-subtle)" },
  accent: { fg: "var(--accent-text)", bg: "var(--accent-subtle)" }
};

export function Badge({ children, tone = "neutral", dot = false, mono = false, style, ...rest }) {
  const t = badgeTones[tone] || badgeTones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        height: 18,
        padding: "0 6px",
        borderRadius: "var(--radius-sm)",
        background: t.bg,
        color: t.fg,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--weight-medium)",
        letterSpacing: mono ? 0 : "var(--tracking-wide)",
        textTransform: mono ? "none" : "uppercase",
        whiteSpace: "nowrap",
        ...style
      }}
      {...rest}
    >
      {dot ? <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: t.fg }} /> : null}
      {children}
    </span>
  );
}
