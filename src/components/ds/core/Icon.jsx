/* eslint-disable react-hooks/static-components --
   `Cmp` below is an existing lucide-react icon component selected from a lookup table by name,
   not a new component type defined during render, so the reset-on-rerender concern the rule
   guards against doesn't apply here. */
import React from "react";
import * as icons from "lucide-react";

/* Single-stroke line icons from the lucide-react package.
   Accepts Lucide's PascalCase or kebab-case names (e.g. "arrow-up-right" or "ArrowUpRight"). */
function lookup(name) {
  if (!name) return null;
  const pascal = String(name)
    .replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/[-_ ]/g, "");
  return icons[pascal] || icons[name] || null;
}

export function Icon({ name, size = 16, strokeWidth = 1.5, color = "currentColor", title, style, ...rest }) {
  const Cmp = lookup(name);
  if (!Cmp) return null;
  return (
    <Cmp
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      style={{ display: "block", flex: "none", ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
    </Cmp>
  );
}
