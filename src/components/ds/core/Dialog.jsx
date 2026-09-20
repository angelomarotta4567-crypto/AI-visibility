import React from "react";
import { IconButton } from "./IconButton.jsx";

export function Dialog({ open = true, title, description, children, footer, onClose, width = 440, style, ...rest }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "var(--space-16) var(--space-4)",
        background: "var(--overlay-scrim)",
        zIndex: 50
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: width,
          maxWidth: "100%",
          background: "var(--surface-1)",
          border: "var(--border-width) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-dialog)",
          ...style
        }}
        {...rest}
      >
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", padding: "var(--space-4) var(--space-4) var(--space-3)" }}>
          <div>
            {title ? <h3 style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)" }}>{title}</h3> : null}
            {description ? (
              <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: "var(--leading-snug)" }}>{description}</p>
            ) : null}
          </div>
          {onClose ? <IconButton icon="x" label="Chiudi" size="sm" onClick={onClose} /> : null}
        </header>
        {children ? <div style={{ padding: "0 var(--space-4) var(--space-4)" }}>{children}</div> : null}
        {footer ? (
          <footer style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)", borderTop: "var(--border-width) solid var(--border-subtle)" }}>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
