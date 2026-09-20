import React from "react";
import { Icon } from "./Icon.jsx";

const iconBtnSizes = { sm: 24, md: 30, lg: 36 };

export function IconButton({ icon, label, size = "md", variant = "ghost", selected = false, disabled = false, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const box = iconBtnSizes[size] || iconBtnSizes.md;
  const bordered = variant === "secondary";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected || undefined}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: box,
        height: box,
        borderRadius: "var(--radius-md)",
        background: selected ? "var(--surface-active)" : hover && !disabled ? "var(--surface-hover)" : "transparent",
        color: selected || hover ? "var(--text-primary)" : "var(--text-secondary)",
        border: "var(--border-width) solid " + (bordered ? "var(--border-default)" : "transparent"),
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
        ...style
      }}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 13 : size === "lg" ? 17 : 15} />
    </button>
  );
}
