import React from "react";

export function Tabs({ tabs = [], value, onChange, style, ...rest }) {
  const items = tabs.map((t) => (typeof t === "string" ? { value: t, label: t } : t));
  const active = value != null ? value : items[0] && items[0].value;
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: "var(--space-4)",
        borderBottom: "var(--border-width) solid var(--border-subtle)",
        ...style
      }}
      {...rest}
    >
      {items.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange && onChange(t.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "0 0 var(--space-2)",
              marginBottom: -1,
              background: "transparent",
              border: 0,
              borderBottom: "1px solid " + (on ? "var(--text-primary)" : "transparent"),
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              letterSpacing: "var(--tracking-tight)",
              cursor: "pointer",
              transition: "color var(--duration-fast) var(--ease-standard)"
            }}
          >
            {t.label}
            {t.count != null ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
