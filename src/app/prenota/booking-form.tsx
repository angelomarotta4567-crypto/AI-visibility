"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { SlotDay } from "@/lib/booking/slots";
import { bookCall, type BookingState } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "var(--text-base)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  fontSize: "var(--text-sm)",
  color: "var(--text-secondary)",
};

export function BookingForm({ days, studioId, studioName }: { days: SlotDay[]; studioId: string; studioName: string }) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(bookCall, { error: null });
  const [selected, setSelected] = useState<string>("");

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <input type="hidden" name="studio_id" value={studioId} />
      <input type="hidden" name="slot" value={selected} />
      <div aria-hidden="true" style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Sito web
          <input type="text" name="sito_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <legend style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
          1. Scegli quando sentirci (20 minuti, al telefono)
        </legend>
        {days.map((day) => (
            <div key={day.label} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", textTransform: "capitalize" }}>{day.label}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {day.slots.map((s) => {
                  const active = selected === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(s.start)}
                      style={{
                        padding: "8px 14px",
                        fontSize: "var(--text-sm)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${active ? "var(--accent-text)" : "var(--border-default)"}`,
                        background: active ? "var(--accent-subtle)" : "var(--bg-surface)",
                        color: active ? "var(--accent-text)" : "var(--text-primary)",
                        fontWeight: active ? "var(--weight-semibold)" : "normal",
                        cursor: "pointer",
                      }}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </fieldset>

      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <legend style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
          2. I tuoi dati
        </legend>
        <label style={labelStyle}>
          Nome e cognome
          <input name="nome" required autoComplete="name" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Studio
          <input name="studio" required defaultValue={studioName} autoComplete="organization" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Telefono (ti chiamo qui)
          <input name="telefono" type="tel" required autoComplete="tel" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Email (facoltativa: ti arriva l&apos;invito in calendario)
          <input name="email" type="email" autoComplete="email" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Qualcosa che vuoi dirmi prima? (facoltativo)
          <textarea name="note" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <label style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          <input type="checkbox" name="consenso" required style={{ marginTop: 3 }} />
          <span>
            Acconsento a essere ricontattato da Angelo Marotta per questa chiamata. Dettagli nella{" "}
            <Link href="/privacy" style={{ color: "var(--accent-text)" }}>
              privacy
            </Link>
            .
          </span>
        </label>
      </fieldset>

      {state.error && (
        <p role="alert" style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--data-negative)" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selected}
        style={{
          padding: "12px 16px",
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-semibold)",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--accent-text)",
          color: "var(--bg-base)",
          cursor: pending ? "wait" : "pointer",
          opacity: pending || !selected ? 0.5 : 1,
        }}
      >
        {pending ? "Sto prenotando…" : selected ? "Prenota la chiamata" : "Scegli prima un orario"}
      </button>
    </form>
  );
}
