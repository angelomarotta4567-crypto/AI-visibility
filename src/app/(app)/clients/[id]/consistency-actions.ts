"use server";

import { createClient } from "@/lib/supabase/server";
import { analysePage, type SourceReport } from "@/lib/remediation/consistency";
import type { OfficialData } from "@/lib/remediation/dentist-schema";
import { isPublicHttpUrl } from "@/lib/remediation/url-safety";

export type SourceInput = { label: string; url: string; isOwnSite?: boolean };

/** Errori come dati, non eccezioni: in produzione Next nasconde il messaggio delle eccezioni delle server action. */
export type CheckResult = { ok: true; reports: SourceReport[] } | { ok: false; error: string };

const MAX_SOURCES = 8;
const TIMEOUT_MS = 8000;
const MAX_HOPS = 4;
const USER_AGENT = "AEO-Diagnosis-Bot/1.0 (+internal visibility audit tool)";
const MAX_HTML_CHARS = 2_000_000;

type Fetched = { ok: boolean; status: number | null; text: string; error: string | null };

/** Scarica una pagina seguendo i reindirizzamenti a mano: ogni passaggio deve
 * restare un indirizzo pubblico (un link pubblico non può rimandare a una rete interna). */
async function fetchPublicPage(startUrl: string): Promise<Fetched> {
  let url = startUrl;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (!isPublicHttpUrl(url)) return { ok: false, status: null, text: "", error: "Il link porta a un indirizzo non consentito." };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": USER_AGENT } });
      const next = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && next) {
        url = new URL(next, url).toString();
        continue;
      }
      return { ok: res.ok, status: res.status, text: await res.text(), error: null };
    } catch (err) {
      return { ok: false, status: null, text: "", error: err instanceof Error && err.name === "AbortError" ? "La pagina non ha risposto in tempo." : "La pagina non si è aperta." };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: null, text: "", error: "Troppi reindirizzamenti." };
}

/** Scarica le pagine pubbliche indicate (sito, MioDottore, PagineGialle...) e
 * le confronta con i dati ufficiali. Non scrive nulla nel database. */
export async function checkConsistencyAction(clientId: string, official: OfficialData, sources: SourceInput[]): Promise<CheckResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Accedi per usare il controllo." };

  // RLS: se l'utente non è del team, il cliente non si vede e il controllo si ferma qui.
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return { ok: false, error: "Cliente non trovato." };

  const wanted = sources
    .map((s) => ({ ...s, url: s.url.trim(), label: s.label.trim().slice(0, 60) || "Pagina" }))
    .filter((s) => s.url)
    .slice(0, MAX_SOURCES);

  const reports = await Promise.all(
    wanted.map(async (s): Promise<SourceReport> => {
      const base = { url: s.url, label: s.label, reachable: false, httpStatus: null as number | null, error: null as string | null, checks: [], structured: null };
      if (!isPublicHttpUrl(s.url)) return { ...base, error: "Indirizzo non valido: serve un link pubblico che inizi con https://" };

      const res = await fetchPublicPage(s.url);
      if (!res.ok || !res.text) {
        const why = res.error ?? (res.status ? `La pagina ha risposto con errore ${res.status}${res.status === 403 || res.status === 429 ? " (il sito blocca le letture automatiche: controllala a mano)" : ""}.` : "Pagina vuota.");
        return { ...base, httpStatus: res.status, error: why };
      }
      const html = res.text.slice(0, MAX_HTML_CHARS);
      const { checks, structured } = analysePage(html, official, Boolean(s.isOwnSite));
      return { ...base, reachable: true, httpStatus: res.status, checks, structured };
    }),
  );
  return { ok: true, reports };
}
