import React from "react";
import { Icon } from "../core/Icon.jsx";

function fmt(v, digits) {
  const n = Math.abs(v).toFixed(digits);
  return (v > 0 ? "+" : v < 0 ? "−" : "") + n;
}

/* Signed numeric change. Green up / red down / grey flat — the only place semantic color is allowed. */
export function Delta({ value = 0, unit = "%", digits = 1, arrow = true, size = "sm", inverted = false, style, ...rest }) {
  const up = value > 0;
  const flat = value === 0;
  const good = inverted ? !up : up;
  const color = flat ? "var(--data-neutral)" : good ? "var(--data-positive)" : "var(--data-negative)";
  const fs = size === "lg" ? "var(--text-md)" : size === "md" ? "var(--text-base)" : "var(--text-xs)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: color,
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        fontSize: fs,
        fontWeight: "var(--weight-medium)",
        letterSpacing: 0,
        ...style
      }}
      {...rest}
    >
      {arrow && !flat ? <Icon name={up ? "arrow-up-right" : "arrow-down-right"} size={size === "lg" ? 14 : 11} strokeWidth={1.75} /> : null}
      {fmt(value, digits)}
      {unit}
    </span>
  );
}
