import React from "react";
import { Icon } from "./Icon.jsx";

export function Checkbox({ checked = false, indeterminate = false, onChange, label, disabled = false, style, ...rest }) {
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: "var(--text-base)",
        color: "var(--text-primary)",
        ...style
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 14, height: 14, margin: 0 }}
        {...rest}
      />
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          flex: "none",
          borderRadius: "var(--radius-xs)",
          background: on ? "var(--accent)" : "var(--surface-1)",
          border: "var(--border-width) solid " + (on ? "var(--accent)" : "var(--border-strong)"),
          color: "var(--text-on-accent)",
          transition: "background var(--duration-fast) var(--ease-standard)"
        }}
      >
        {indeterminate ? <Icon name="minus" size={10} strokeWidth={2.4} /> : checked ? <Icon name="check" size={10} strokeWidth={2.4} /> : null}
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
