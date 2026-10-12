// Confronta i dati ufficiali dello studio con quello che una pagina pubblica
// (sito, MioDottore, PagineGialle...) dice davvero. Funzioni pure: il download
// delle pagine sta nella server action.

import { nationalDigits, type OfficialData } from "./dentist-schema";

export type CheckStatus = "ok" | "differente" | "non_trovato";
export type FieldCheck = { field: "telefono" | "indirizzo" | "nome" | "dati strutturati"; status: CheckStatus; detail: string };

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Minuscole, senza accenti, abbreviazioni di via sciolte, punteggiatura tolta. */
export function normText(s: string): string {
  return strip(s.toLowerCase())
    .replace(/[’`´]/g, "'")
    .replace(/\bv\.\s*le\b/g, "viale")
    .replace(/\bp\.\s*zza\b/g, "piazza")
    .replace(/\bc\.\s*so\b/g, "corso")
    .replace(/\bl\.\s*go\b/g, "largo")
    .replace(/\bv\.\s*(?=[a-z])/g, "via ")
    .replace(/[^a-z0-9/ ']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STREET_TYPES = ["via", "viale", "piazza", "piazzale", "largo", "corso", "vicolo", "strada", "vle", "loc", "localita"];

type Street = { core: string; number: string };

/** "Viale Natale Betelli, 23/A" -> { core: "natale betelli", number: "23a" }. */
export function parseStreet(addr: string): Street {
  const toks = normText(addr).split(" ").filter(Boolean);
  if (toks.length && STREET_TYPES.includes(toks[0])) toks.shift();
  let number = "";
  for (let i = 0; i < toks.length; i++) {
    if (/^\d/.test(toks[i])) {
      number = toks[i];
      if (toks[i + 1] && /^[a-z]$/.test(toks[i + 1])) number += toks[i + 1];
      toks.splice(i);
      break;
    }
  }
  return { core: toks.join(" ").trim(), number: number.replace(/\s/g, "") };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Cerca la via nel testo e legge il civico che la segue. */
export function checkAddress(text: string, street: string): FieldCheck {
  const want = parseStreet(street);
  if (!want.core) return { field: "indirizzo", status: "non_trovato", detail: "Indirizzo ufficiale vuoto." };

  const hay = normText(text);
  const re = new RegExp(`(?:${STREET_TYPES.join("|")})?\\s*${want.core.split(" ").map(escape).join("\\s+")}\\s*[,]?\\s*(?:n\\s*)?(\\d+(?:\\s?/\\s?[a-z]\\b|[a-z]\\b|\\s[a-z]\\b)?)?`, "g");
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(hay)) !== null) {
    found.push((m[1] ?? "").replace(/[\/\s]/g, ""));
    if (found.length >= 8) break;
  }
  if (found.length === 0) return { field: "indirizzo", status: "non_trovato", detail: `La via «${street}» non compare nella pagina.` };

  if (!want.number) return { field: "indirizzo", status: "ok", detail: "La via compare (nell'indirizzo ufficiale manca il numero civico)." };
  // "62/64" è un civico doppio: basta trovare uno dei due numeri; "23/A" resta "23a".
  const acceptable = new Set([want.number.replace(/\//g, "")]);
  const dual = want.number.match(/^(\d+)\/(\d+)$/);
  if (dual) {
    acceptable.add(dual[1]);
    acceptable.add(dual[2]);
  }
  if (found.some((f) => acceptable.has(f))) return { field: "indirizzo", status: "ok", detail: `Via e civico coincidono (${street}).` };
  const others = [...new Set(found.filter(Boolean))];
  return {
    field: "indirizzo",
    status: "differente",
    detail: others.length ? `La via compare ma con civico diverso: nella pagina «${others.join(", ")}», ufficiale «${want.number.replace(/\//g, "")}».` : "La via compare ma senza numero civico leggibile.",
  };
}

/** Numeri di telefono italiani presenti nel testo, ridotti alle sole cifre nazionali. */
export function findPhones(text: string): string[] {
  const re = /(?:\+|00)?(?:39[\s.\-]*)?(0\d{1,3}|3\d{2})[\s.\-/]*(\d{2,4})[\s.\-/]*(\d{2,5})/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const d = `${m[1]}${m[2]}${m[3]}`;
    // Fissi e cellulari italiani hanno 8-10 cifre: le partite IVA (11) e i codici più lunghi non sono telefoni.
    if (d.length < 8 || d.length > 10) continue;
    const before = text.slice(Math.max(0, m.index - 16), m.index).toLowerCase();
    if (/iva|p\.\s?i|c\.\s?f|cod\.?\s?fisc|\brea\b/.test(before)) continue;
    out.add(d);
  }
  return [...out];
}

export function checkPhone(text: string, phone: string): FieldCheck {
  const want = nationalDigits(phone);
  if (want.length < 6) return { field: "telefono", status: "non_trovato", detail: "Telefono ufficiale vuoto o incompleto." };
  const found = findPhones(text);
  if (found.includes(want)) return { field: "telefono", status: "ok", detail: `Il numero ${phone} compare nella pagina.` };
  if (found.length) return { field: "telefono", status: "differente", detail: `Nella pagina compaiono altri numeri: ${found.slice(0, 4).join(", ")}. Ufficiale: ${want}.` };
  return { field: "telefono", status: "non_trovato", detail: "Nessun numero di telefono leggibile nella pagina." };
}

const GENERIC = new Set(["studio", "dentistico", "odontoiatrico", "centro", "medico", "dott", "dr", "dottor", "dottoressa", "ssa", "di", "del", "della", "e", "srl", "srls", "snc", "sas", "associato"]);

export function checkName(text: string, name: string): FieldCheck {
  const hay = normText(text);
  const want = normText(name);
  if (!want) return { field: "nome", status: "non_trovato", detail: "Nome ufficiale vuoto." };
  if (hay.includes(want)) return { field: "nome", status: "ok", detail: `Il nome «${name}» compare identico.` };
  const tokens = want.split(" ").filter((t) => t.length > 2 && !GENERIC.has(t));
  if (tokens.length && tokens.every((t) => hay.includes(t))) {
    return { field: "nome", status: "differente", detail: `Compaiono le parole del nome ma scritte in modo diverso da «${name}»: scegli una forma sola e usala ovunque.` };
  }
  return { field: "nome", status: "non_trovato", detail: `Il nome «${name}» non compare nella pagina.` };
}

type JsonObj = Record<string, unknown>;

/** Oggetti JSON-LD della pagina, seguendo @graph. I blocchi malformati si saltano. */
export function extractJsonLdObjects(html: string): JsonObj[] {
  const out: JsonObj[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    const o = n as JsonObj;
    out.push(o);
    if (Array.isArray(o["@graph"])) walk(o["@graph"]);
  };
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      // un blocco rotto è già un problema da segnalare altrove
    }
  }
  return out;
}

const BUSINESS_TYPES = ["Dentist", "MedicalBusiness", "MedicalClinic", "LocalBusiness", "Physician", "Organization"];

function typesOf(o: JsonObj): string[] {
  const t = o["@type"];
  return Array.isArray(t) ? t.filter((x): x is string => typeof x === "string") : typeof t === "string" ? [t] : [];
}

/** Controlla i dati strutturati già presenti nel sito: tipo giusto e dati uguali a quelli ufficiali. */
export function checkJsonLd(html: string, o: OfficialData): FieldCheck[] {
  const objs = extractJsonLdObjects(html);
  const biz = objs.find((x) => typesOf(x).some((t) => BUSINESS_TYPES.includes(t)));
  if (!biz) {
    return [{ field: "dati strutturati", status: "non_trovato", detail: objs.length ? "Ci sono dati strutturati ma nessuno dello studio (tipo Dentist o LocalBusiness)." : "Nessun blocco di dati strutturati (JSON-LD) nella pagina." }];
  }

  const checks: FieldCheck[] = [];
  const types = typesOf(biz);
  checks.push(
    types.includes("Dentist")
      ? { field: "dati strutturati", status: "ok", detail: "Tipo «Dentist»: è il più preciso." }
      : { field: "dati strutturati", status: "differente", detail: `Tipo «${types.join(", ")}»: meglio «Dentist», più specifico per uno studio dentistico.` },
  );

  const tel = typeof biz.telephone === "string" ? biz.telephone : "";
  if (tel) {
    const same = nationalDigits(tel) === nationalDigits(o.telephone);
    checks.push({ field: "telefono", status: same ? "ok" : "differente", detail: same ? "Il telefono nei dati strutturati coincide." : `Nei dati strutturati il telefono è «${tel}», ufficiale «${o.telephone}».` });
  } else checks.push({ field: "telefono", status: "non_trovato", detail: "Nei dati strutturati manca il telefono." });

  const addr = biz.address as JsonObj | string | undefined;
  const street = typeof addr === "string" ? addr : typeof addr?.streetAddress === "string" ? addr.streetAddress : "";
  if (street) {
    const a = checkAddress(street, o.streetAddress);
    checks.push({ ...a, detail: `Nei dati strutturati: ${a.detail}` });
  } else checks.push({ field: "indirizzo", status: "non_trovato", detail: "Nei dati strutturati manca l'indirizzo." });

  const nm = typeof biz.name === "string" ? biz.name : "";
  if (nm) {
    const same = normText(nm) === normText(o.name);
    checks.push({ field: "nome", status: same ? "ok" : "differente", detail: same ? "Il nome nei dati strutturati coincide." : `Nei dati strutturati il nome è «${nm}», ufficiale «${o.name}».` });
  } else checks.push({ field: "nome", status: "non_trovato", detail: "Nei dati strutturati manca il nome." });

  return checks;
}

export type SourceReport = {
  url: string;
  label: string;
  reachable: boolean;
  httpStatus: number | null;
  error: string | null;
  checks: FieldCheck[];
  structured: FieldCheck[] | null;
};

/** Analisi di una pagina già scaricata. `isOwnSite`: controlla anche i dati strutturati. */
export function analysePage(html: string, o: OfficialData, isOwnSite: boolean): { checks: FieldCheck[]; structured: FieldCheck[] | null } {
  const text = htmlToText(html);
  return {
    checks: [checkName(text, o.name), checkAddress(text, o.streetAddress), checkPhone(text, o.telephone)],
    structured: isOwnSite ? checkJsonLd(html, o) : null,
  };
}
