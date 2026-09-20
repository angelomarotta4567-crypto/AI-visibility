import React from "react";
import { Icon } from "./Icon.jsx";

export function Input({
  value,
  onChange,
  placeholder,
  label,
  hint,
  icon,
  suffix,
  numeric = false,
  invalid = false,
  disabled = false,
  size = "md",
  fullWidth = true,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "sm" ? "var(--control-height-sm)" : size === "lg" ? "var(--control-height-lg)" : "var(--control-height)";
  const border = invalid ? "var(--data-negative)" : focus ? "var(--accent-border)" : "var(--border-default)";
  return (
    <label style={{ display: "block", width: fullWidth ? "100%" : undefined, ...style }}>
      {label ? (
        <span style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
          {label}
        </span>
      ) : null}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          height: h,
          padding: "0 var(--space-3)",
          background: disabled ? "var(--surface-2)" : "var(--surface-1)",
          border: "var(--border-width) solid " + border,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "0 0 0 2px var(--accent-subtle)" : "none",
          transition: "border-color var(--duration-fast) var(--ease-standard)"
        }}
      >
        {icon ? <Icon name={icon} size={14} color="var(--text-tertiary)" /> : null}
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            color: disabled ? "var(--text-disabled)" : "var(--text-primary)",
            fontFamily: numeric ? "var(--font-mono)" : "var(--font-sans)",
            fontVariantNumeric: numeric ? "tabular-nums" : undefined,
            fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-base)",
            textAlign: numeric ? "right" : "left",
            letterSpacing: numeric ? 0 : "var(--tracking-tight)"
          }}
          {...rest}
        />
        {suffix ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{suffix}</span>
        ) : null}
      </span>
      {hint ? (
        <span style={{ display: "block", marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: invalid ? "var(--data-negative)" : "var(--text-tertiary)" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
