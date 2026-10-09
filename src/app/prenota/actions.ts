"use server";

import { redirect } from "next/navigation";
import { fetchBusy, sendBooking } from "@/lib/booking/make";
import { formatSlotLabel, isOfferedSlot, removeBusy } from "@/lib/booking/slots";

export type BookingState = { error: string | null };

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function bookCall(_prev: BookingState, formData: FormData): Promise<BookingState> {
  // Campo nascosto: le persone non lo vedono, i bot lo compilano.
  if (clean(formData.get("sito_web"), 200)) redirect("/prenota/confermata");

  const nome = clean(formData.get("nome"), 120);
  const studio = clean(formData.get("studio"), 160);
  const telefono = clean(formData.get("telefono"), 40);
  const email = clean(formData.get("email"), 160);
  const note = clean(formData.get("note"), 1000);
  const studioId = clean(formData.get("studio_id"), 40);
  const start = clean(formData.get("slot"), 40);

  if (!nome || !studio || !telefono) return { error: "Inserisci nome, studio e telefono." };
  if (telefono.replace(/\D/g, "").length < 6) return { error: "Il numero di telefono non sembra completo." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "L'indirizzo email non sembra valido." };
  if (formData.get("consenso") !== "on") return { error: "Serve il consenso per poterti ricontattare." };

  const slot = isOfferedSlot(start);
  if (!slot) return { error: "Scegli un giorno e un orario tra quelli disponibili." };

  const busy = await fetchBusy(slot.start, slot.end);
  if (busy && removeBusy([slot], busy).length === 0) {
    return { error: "Questo orario è appena stato occupato: scegline un altro." };
  }

  const quando = formatSlotLabel(slot.start);
  let ok = false;
  try {
    ok = await sendBooking({ studioId, nome, studio, telefono, email, note, start: slot.start, end: slot.end, quando });
  } catch {
    ok = false;
  }
  if (!ok) {
    return { error: "Non sono riuscito a salvare la prenotazione. Riprova tra un minuto o chiamami al +39 392 111 5365." };
  }

  redirect(`/prenota/confermata?quando=${encodeURIComponent(quando)}`);
}
