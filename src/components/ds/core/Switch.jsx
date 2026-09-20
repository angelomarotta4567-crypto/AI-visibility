import React from "react";

export function Switch({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: "var(--text-base)",
        color: "var(--text-primary)",
        ...style
      }}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 28, height: 16, margin: 0 }}
        {...rest}
      />
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: 28,
          height: 16,
          flex: "none",
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--accent)" : "var(--surface-3)",
          border: "var(--border-width) solid " + (checked ? "var(--accent)" : "var(--border-default)"),
          transition: "background var(--duration-base) var(--ease-standard)"
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 13 : 2,
            width: 10,
            height: 10,
            borderRadius: "var(--radius-pill)",
            background: checked ? "var(--text-on-accent)" : "var(--text-secondary)",
            transition: "left var(--duration-base) var(--ease-standard)"
          }}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
