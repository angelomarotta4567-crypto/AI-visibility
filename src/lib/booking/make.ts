import "server-only";
import type { BusyInterval } from "./slots";

// Le prenotazioni passano da uno scenario Make ("AI Visibility – 2. Calendario
// e prenotazioni") che ha accesso al Google Calendar di Angelo: con
// action=availability restituisce gli intervalli occupati, con action=book crea
// l'evento e salva la prenotazione su Airtable. Il segreto condiviso evita che
// chiunque conosca l'URL del webhook possa leggere o scrivere nel calendario.

function config() {
  const url = process.env.MAKE_CALENDAR_WEBHOOK_URL;
  const secret = process.env.MAKE_WEBHOOK_SECRET;
  if (!url || !secret) {
    throw new Error("Configurazione prenotazioni mancante (MAKE_CALENDAR_WEBHOOK_URL / MAKE_WEBHOOK_SECRET)");
  }
  return { url, secret };
}

/** Intervalli occupati del calendario, o null se Make non risponde (la pagina
 * mostra comunque gli slot: meglio un raro doppione da spostare che perdere il contatto). */
export async function fetchBusy(timeMin: string, timeMax: string): Promise<BusyInterval[] | null> {
  try {
    const { url, secret } = config();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "availability", timeMin, timeMax }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const list = Array.isArray(data) ? data : (data as { busy?: unknown })?.busy;
    if (!Array.isArray(list)) return null;
    return list
      .filter((b): b is BusyInterval => typeof b?.start === "string" && typeof b?.end === "string")
      .map((b) => ({ start: b.start, end: b.end }));
  } catch {
    return null;
  }
}

export type BookingPayload = {
  studioId: string;
  nome: string;
  studio: string;
  telefono: string;
  email: string;
  note: string;
  start: string;
  end: string;
  quando: string;
};

export async function sendBooking(payload: BookingPayload): Promise<boolean> {
  const { url, secret } = config();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, action: "book", ...payload }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  // Make risponde 200 "Accepted" anche quando lo scenario si ferma prima di
  // creare l'evento: conta come riuscita solo la risposta esplicita {ok: true}.
  if (!res.ok) return false;
  const data = (await res.json().catch(() => null)) as { ok?: unknown } | null;
  return data?.ok === true;
}
