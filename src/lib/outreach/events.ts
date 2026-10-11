import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Anteprime dei link (WhatsApp, Slack...), crawler e strumenti da riga di
// comando non sono persone che scansionano il QR: non vanno contati.
const NOT_A_PERSON = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|telegram|curl|wget|headless|lighthouse/i;

// Stesso studio, stesse visite entro questa finestra = un ricaricamento della
// pagina, non una nuova persona. È un'approssimazione dichiarata: senza cookie
// non si può distinguere chi torna da chi è nuovo.
const VISIT_DEDUPE_MS = 10 * 60 * 1000;

/** Registra una visita a /prenota o una prenotazione riuscita. Non deve mai
 * rompere la pagina: qualunque errore viene solo scritto nel log. Lo user
 * agent serve solo a scartare bot e anteprime dei link e non viene salvato;
 * va letto prima (dentro after() gli header di una pagina non sono leggibili). */
export async function recordOutreachEvent(
  kind: "visit" | "booking",
  studioId: string,
  studioName: string,
  userAgent = "",
) {
  try {
    if (kind === "visit" && (!userAgent || NOT_A_PERSON.test(userAgent))) return;
    const supabase = createServiceClient();
    if (kind === "visit") {
      const since = new Date(Date.now() - VISIT_DEDUPE_MS).toISOString();
      let q = supabase.from("outreach_events").select("id", { head: true, count: "exact" }).eq("kind", "visit").gte("created_at", since);
      q = studioId ? q.eq("studio_id", studioId) : q.is("studio_id", null);
      const { count } = await q;
      if ((count ?? 0) > 0) return;
    }
    await supabase.from("outreach_events").insert({
      kind,
      studio_id: studioId || null,
      studio_name: studioName.slice(0, 120) || null,
    });
  } catch (err) {
    console.error("[outreach-events] non registrato:", err);
  }
}
