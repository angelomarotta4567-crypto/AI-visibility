import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Dense table. Columns: {key, header, align, numeric, width, render}. Numeric cells are monospace, right-aligned. */
export function DataTable({
  columns = [],
  rows = [],
  sort,
  onSortChange,
  onRowClick,
  selectedKey,
  rowKey = "id",
  compact = false,
  stickyHeader = true,
  style,
  ...rest
}) {
  const [hoverRow, setHoverRow] = React.useState(null);
  const h = compact ? "var(--row-height-compact)" : "var(--row-height)";
  return (
    <div style={{ width: "100%", overflow: "auto", ...style }} {...rest}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-base)" }}>
        <thead>
          <tr>
            {columns.map((c) => {
              const sorted = sort && sort.key === c.key;
              const numeric = c.numeric || c.align === "right";
              return (
                <th
                  key={c.key}
                  onClick={() => c.sortable !== false && onSortChange && onSortChange(c.key)}
                  style={{
                    position: stickyHeader ? "sticky" : "static",
                    top: 0,
                    zIndex: 1,
                    background: "var(--bg-base)",
                    padding: "0 var(--space-3)",
                    height: 28,
                    width: c.width,
                    textAlign: numeric ? "right" : "left",
                    whiteSpace: "nowrap",
                    borderBottom: "var(--border-width) solid var(--border-default)",
                    color: sorted ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--weight-medium)",
                    letterSpacing: "var(--tracking-label)",
                    textTransform: "uppercase",
                    cursor: c.sortable === false ? "default" : "pointer",
                    userSelect: "none"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexDirection: numeric ? "row-reverse" : "row" }}>
                    {c.header}
                    {sorted ? <Icon name={sort.dir === "asc" ? "chevron-up" : "chevron-down"} size={11} /> : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = r[rowKey] != null ? r[rowKey] : i;
            const on = selectedKey != null && selectedKey === key;
            return (
              <tr
                key={key}
                onClick={() => onRowClick && onRowClick(r)}
                onMouseEnter={() => setHoverRow(key)}
                onMouseLeave={() => setHoverRow(null)}
                style={{
                  height: h,
                  background: on ? "var(--surface-active)" : hoverRow === key ? "var(--surface-hover)" : "transparent",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background var(--duration-fast) var(--ease-standard)"
                }}
              >
                {columns.map((c) => {
                  const numeric = c.numeric || c.align === "right";
                  const content = c.render ? c.render(r) : r[c.key];
                  return (
                    <td
                      key={c.key}
                      style={{
                        padding: "0 var(--space-3)",
                        borderBottom: "var(--border-width) solid var(--border-subtle)",
                        textAlign: numeric ? "right" : "left",
                        whiteSpace: "nowrap",
                        color: "var(--text-primary)",
                        fontFamily: numeric ? "var(--font-mono)" : "var(--font-sans)",
                        fontVariantNumeric: numeric ? "tabular-nums" : undefined,
                        fontSize: numeric ? "var(--text-sm)" : "var(--text-base)",
                        letterSpacing: numeric ? 0 : "var(--tracking-tight)"
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
