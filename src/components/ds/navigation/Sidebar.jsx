import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Linear-style rail: icon + label, active state is a faint surface change, never a filled color block. */
export function Sidebar({ brand = "Segnale", sections = [], activeKey, onNavigate, footer, style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  return (
    <nav
      style={{
        width: "var(--sidebar-width)",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        padding: "var(--space-3)",
        background: "var(--bg-sunken)",
        borderRight: "var(--border-width) solid var(--border-subtle)",
        height: "100%",
        boxSizing: "border-box",
        ...style
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", height: "var(--control-height)", padding: "0 var(--space-2)" }}>
        <span style={{ width: 16, height: 16, flex: "none", borderRadius: 3, border: "1.5px solid var(--accent)", position: "relative" }}>
          <span style={{ position: "absolute", left: 2, bottom: 2, width: 3, height: 5, background: "var(--accent)" }} />
          <span style={{ position: "absolute", left: 6, bottom: 2, width: 3, height: 9, background: "var(--accent)" }} />
        </span>
        <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-tight)" }}>{brand}</span>
      </div>

      {sections.map((sec, si) => (
        <div key={si} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {sec.title ? (
            <div style={{ padding: "0 var(--space-2) var(--space-2)", fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
              {sec.title}
            </div>
          ) : null}
          {(sec.items || []).map((it) => {
            const on = it.key === activeKey;
            const hot = hover === it.key;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onNavigate && onNavigate(it.key)}
                onMouseEnter={() => setHover(it.key)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  height: 28,
                  padding: "0 var(--space-2)",
                  background: on ? "var(--surface-active)" : hot ? "var(--surface-hover)" : "transparent",
                  border: "var(--border-width) solid " + (on ? "var(--border-subtle)" : "transparent"),
                  borderRadius: "var(--radius-sm)",
                  color: on ? "var(--text-primary)" : hot ? "var(--text-primary)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  fontWeight: on ? "var(--weight-medium)" : "var(--weight-regular)",
                  letterSpacing: "var(--tracking-tight)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)"
                }}
              >
                {it.icon ? <Icon name={it.icon} size={14} /> : null}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                {it.count != null ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>{it.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: "auto" }}>{footer}</div>
    </nav>
  );
}
