import React from "react";

export function Tooltip({ children, content, side = "top", mono = false, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const pos =
    side === "bottom"
      ? { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" }
      : side === "left"
      ? { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" }
      : side === "right"
      ? { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" }
      : { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" };
  return (
    <span
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...rest}
    >
      {children}
      {open && content ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            ...pos,
            zIndex: 40,
            padding: "4px 7px",
            background: "var(--surface-3)",
            border: "var(--border-width) solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-popover)",
            color: "var(--text-primary)",
            fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
            fontSize: "var(--text-xs)",
            whiteSpace: "nowrap",
            pointerEvents: "none"
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
