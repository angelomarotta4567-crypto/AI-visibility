import React from "react";
import { Icon } from "./Icon.jsx";

const btnSizes = {
  sm: { height: "var(--control-height-sm)", padding: "0 var(--space-2)", font: "var(--text-xs)", icon: 12 },
  md: { height: "var(--control-height)", padding: "0 var(--space-3)", font: "var(--text-base)", icon: 14 },
  lg: { height: "var(--control-height-lg)", padding: "0 var(--space-4)", font: "var(--text-md)", icon: 16 }
};

function btnSkin(variant, hover, active) {
  if (variant === "secondary")
    return {
      background: active ? "var(--surface-active)" : hover ? "var(--surface-hover)" : "transparent",
      color: "var(--text-primary)",
      border: "var(--border-width) solid " + (hover ? "var(--border-strong)" : "var(--border-default)")
    };
  if (variant === "ghost")
    return {
      background: active ? "var(--surface-active)" : hover ? "var(--surface-hover)" : "transparent",
      color: hover ? "var(--text-primary)" : "var(--text-secondary)",
      border: "var(--border-width) solid transparent"
    };
  if (variant === "danger")
    return {
      background: "transparent",
      color: "var(--data-negative)",
      border: "var(--border-width) solid " + (hover ? "var(--data-negative)" : "var(--border-default)")
    };
  return {
    background: active ? "var(--accent-active)" : hover ? "var(--accent-hover)" : "var(--accent)",
    color: "var(--text-on-accent)",
    border: "var(--border-width) solid transparent"
  };
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled = false,
  fullWidth = false,
  type = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const s = btnSizes[size] || btnSizes.md;
  const skin = btnSkin(variant, hover && !disabled, active && !disabled);
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        height: s.height,
        padding: s.padding,
        width: fullWidth ? "100%" : undefined,
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        fontWeight: "var(--weight-medium)",
        letterSpacing: "var(--tracking-tight)",
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
        transition: "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
        ...skin,
        ...style
      }}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={s.icon} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={s.icon} /> : null}
    </button>
  );
}
