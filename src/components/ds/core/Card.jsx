import React from "react";

export function Card({ children, title, kicker, actions, footer, padding = "md", inset = false, style, ...rest }) {
  const pad = padding === "none" ? 0 : padding === "sm" ? "var(--space-3)" : padding === "lg" ? "var(--space-6)" : "var(--space-4)";
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        background: inset ? "var(--bg-sunken)" : "var(--surface-1)",
        border: "var(--border-width) solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        ...style
      }}
      {...rest}
    >
      {title || actions || kicker ? (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            borderBottom: "var(--border-width) solid var(--border-subtle)"
          }}
        >
          <div style={{ minWidth: 0 }}>
            {kicker ? (
              <div style={{ fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2 }}>
                {kicker}
              </div>
            ) : null}
            {title ? <h4 style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)" }}>{title}</h4> : null}
          </div>
          {actions ? <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: "none" }}>{actions}</div> : null}
        </header>
      ) : null}
      <div style={{ padding: pad, flex: 1, minHeight: 0 }}>{children}</div>
      {footer ? (
        <footer style={{ padding: "var(--space-3) var(--space-4)", borderTop: "var(--border-width) solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: "var(--text-xs)" }}>
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
