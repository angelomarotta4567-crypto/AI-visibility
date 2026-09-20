import React from "react";

export function SegmentedControl({ options = [], value, onChange, size = "md", style, ...rest }) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const active = value != null ? value : items[0] && items[0].value;
  const h = size === "sm" ? "var(--control-height-sm)" : "var(--control-height)";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        height: h,
        padding: 2,
        gap: 2,
        background: "var(--surface-2)",
        border: "var(--border-width) solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        ...style
      }}
      {...rest}
    >
      {items.map((o) => {
        const on = o.value === active;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange && onChange(o.value)}
            style={{
              padding: "0 var(--space-3)",
              background: on ? "var(--surface-3)" : "transparent",
              border: "var(--border-width) solid " + (on ? "var(--border-default)" : "transparent"),
              borderRadius: "var(--radius-sm)",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: size === "sm" ? "var(--text-2xs)" : "var(--text-xs)",
              fontWeight: "var(--weight-medium)",
              cursor: "pointer",
              transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)"
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
