import React from "react";
import { Icon } from "./Icon.jsx";

export function Select({ value, onChange, options = [], label, size = "md", disabled = false, fullWidth = false, style, ...rest }) {
  const h = size === "sm" ? "var(--control-height-sm)" : size === "lg" ? "var(--control-height-lg)" : "var(--control-height)";
  return (
    <label style={{ display: "block", width: fullWidth ? "100%" : undefined, ...style }}>
      {label ? (
        <span style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
          {label}
        </span>
      ) : null}
      <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            appearance: "none",
            width: "100%",
            height: h,
            padding: "0 var(--space-7, 28px) 0 var(--space-3)",
            background: "var(--surface-1)",
            color: disabled ? "var(--text-disabled)" : "var(--text-primary)",
            border: "var(--border-width) solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-sans)",
            fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-base)",
            letterSpacing: "var(--tracking-tight)",
            cursor: disabled ? "not-allowed" : "pointer"
          }}
          {...rest}
        >
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <span style={{ position: "absolute", right: "var(--space-2)", pointerEvents: "none", color: "var(--text-tertiary)" }}>
          <Icon name="chevron-down" size={13} />
        </span>
      </span>
    </label>
  );
}
