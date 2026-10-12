// Genera il blocco JSON-LD "Dentist" (schema.org) dai dati ufficiali dello
// studio. Funzioni pure, senza dipendenze dal server: si usano sia nella
// pagina (anteprima in tempo reale) sia negli script di verifica.

export type OfficialData = {
  name: string;
  url: string;
  telephone: string;
  email: string;
  streetAddress: string;
  postalCode: string;
  locality: string;
  region: string;
  image: string;
  /** Una riga per fascia, es. "lun-ven 09:00-13:00, 14:30-19:00". */
  hours: string;
  /** Un trattamento per riga. */
  services: string;
  /** Un link per riga (MioDottore, Facebook, scheda Google...). */
  sameAs: string;
};

export const EMPTY_OFFICIAL: OfficialData = {
  name: "",
  url: "",
  telephone: "",
  email: "",
  streetAddress: "",
  postalCode: "",
  locality: "",
  region: "BG",
  image: "",
  hours: "",
  services: "",
  sameAs: "",
};

export type HoursSpec = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] as const;
const DAY_NAME: Record<(typeof DAYS)[number], string> = {
  lun: "Monday",
  mar: "Tuesday",
  mer: "Wednesday",
  gio: "Thursday",
  ven: "Friday",
  sab: "Saturday",
  dom: "Sunday",
};

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function dayIndex(token: string): number {
  const t = stripAccents(token.trim().toLowerCase()).slice(0, 3);
  return DAYS.indexOf(t as (typeof DAYS)[number]);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Interpreta gli orari scritti come li scrive una segretaria. Ogni riga:
 * giorni (lun-ven, sab, lun,mer,gio) + una o più fasce (09:00-13:00, 14:30-19:00).
 * Le righe che non capisce finiscono in `errors`, mai ignorate in silenzio. */
export function parseHours(text: string): { specs: HoursSpec[]; errors: string[] } {
  const specs: HoursSpec[] = [];
  const errors: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const m = line.match(/^([^\d]+?)\s+(\d.*)$/);
    if (!m) {
      errors.push(`Riga non capita: «${line}». Scrivila come «lun-ven 09:00-13:00, 14:30-19:00».`);
      continue;
    }

    const days: number[] = [];
    let dayError = false;
    for (const part of m[1].split(/\s*[,;]\s*|\s+e\s+/)) {
      const p = part.trim();
      if (!p) continue;
      const range = p.split(/\s*[-–]\s*/);
      if (range.length === 2) {
        const a = dayIndex(range[0]);
        const b = dayIndex(range[1]);
        if (a < 0 || b < 0) {
          dayError = true;
          break;
        }
        for (let i = a; ; i = (i + 1) % 7) {
          days.push(i);
          if (i === b) break;
        }
      } else {
        const a = dayIndex(p);
        if (a < 0) {
          dayError = true;
          break;
        }
        days.push(a);
      }
    }
    if (dayError || days.length === 0) {
      errors.push(`Giorni non capiti nella riga «${line}». Usa lun, mar, mer, gio, ven, sab, dom.`);
      continue;
    }

    const times = [...m[2].matchAll(/(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/g)];
    if (times.length === 0) {
      errors.push(`Orari non capiti nella riga «${line}».`);
      continue;
    }

    const dayOfWeek = [...new Set(days)].map((i) => DAY_NAME[DAYS[i]]);
    for (const t of times) {
      const oh = Number(t[1]);
      const om = Number(t[2] ?? 0);
      const ch = Number(t[3]);
      const cm = Number(t[4] ?? 0);
      if (oh > 24 || ch > 24 || om > 59 || cm > 59 || oh * 60 + om >= ch * 60 + cm) {
        errors.push(`Fascia non valida «${t[0]}» nella riga «${line}»: l'apertura deve venire prima della chiusura.`);
        continue;
      }
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek,
        opens: `${pad(oh)}:${pad(om)}`,
        closes: `${pad(ch)}:${pad(cm)}`,
      });
    }
  }

  return { specs, errors };
}

/** Cifre del numero senza prefisso internazionale (+39 / 0039). */
export function nationalDigits(input: string): string {
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("+39")) d = d.slice(3);
  else if (d.startsWith("0039")) d = d.slice(4);
  return d.replace(/\D/g, "");
}

/** "035565132" -> "+39 035 565132"; "3921115365" -> "+39 392 111 5365". */
export function formatPhoneIT(input: string): string {
  const n = nationalDigits(input);
  if (n.length < 6) return input.trim();
  if (n.startsWith("3")) return `+39 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`.trim();
  const area = n.startsWith("02") || n.startsWith("06") ? 2 : 3;
  return `+39 ${n.slice(0, area)} ${n.slice(area)}`;
}

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export type SchemaResult = {
  jsonLd: Record<string, unknown> | null;
  /** Blocco già pronto da incollare nel sito (con i tag <script>). */
  snippet: string;
  /** Campi obbligatori ancora vuoti: senza questi il blocco non viene generato. */
  missing: string[];
  /** Cose da controllare prima di pubblicare (regole del manuale e della pubblicità sanitaria). */
  warnings: string[];
};

export function buildDentistJsonLd(d: OfficialData): SchemaResult {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("Nome dello studio");
  if (!d.streetAddress.trim()) missing.push("Via e numero civico");
  if (!d.postalCode.trim()) missing.push("CAP");
  if (!d.locality.trim()) missing.push("Comune");
  if (!d.telephone.trim()) missing.push("Telefono");

  const warnings: string[] = [];
  const name = d.name.trim();

  if (name) {
    if (/\b(migliore|miglior|top|low ?cost|economic\w*|conveniente|offerta|promo\w*)\b/i.test(name)) {
      warnings.push("Il nome contiene parole promozionali: deve essere identico all'insegna e la pubblicità sanitaria vieta superlativi e promozioni.");
    }
    if (d.locality.trim() && stripAccents(name.toLowerCase()).includes(stripAccents(d.locality.trim().toLowerCase()))) {
      warnings.push(`Il nome contiene «${d.locality.trim()}»: va bene solo se è scritto davvero sull'insegna. Google sospende le schede con parole aggiunte al nome.`);
    }
  }
  if (d.postalCode.trim() && !/^\d{5}$/.test(d.postalCode.trim())) warnings.push("Il CAP dovrebbe avere 5 cifre.");
  if (d.telephone.trim() && nationalDigits(d.telephone).length < 6) warnings.push("Il telefono sembra incompleto.");
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) warnings.push("L'email non sembra valida.");
  if (d.url.trim() && !isHttpUrl(d.url.trim())) warnings.push("Il sito deve iniziare con https://");
  if (d.image.trim() && !isHttpUrl(d.image.trim())) warnings.push("L'indirizzo della foto deve iniziare con https://");

  const sameAs = lines(d.sameAs);
  const badLinks = sameAs.filter((l) => !isHttpUrl(l));
  if (badLinks.length) warnings.push(`Link non validi tra i profili: ${badLinks.join(", ")}`);

  const hours = parseHours(d.hours);
  warnings.push(...hours.errors);

  if (!d.url.trim()) warnings.push("Manca il sito: senza indirizzo del sito il blocco non collega i dati alla pagina.");
  if (!d.hours.trim()) warnings.push("Mancano gli orari: orari sbagliati o assenti sono tra i motivi più comuni per cui un'AI esclude un'attività.");
  if (!d.image.trim()) warnings.push("Manca una foto dello studio (esterno riconoscibile): consigliata.");
  if (sameAs.length === 0) warnings.push("Mancano i profili collegati (MioDottore, Facebook, scheda Google): aiutano le AI a capire che sono lo stesso studio.");
  if (!d.email.trim()) warnings.push("Manca l'email (facoltativa, ma utile).");

  if (missing.length > 0) return { jsonLd: null, snippet: "", missing, warnings };

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name,
    ...(d.url.trim() ? { url: d.url.trim() } : {}),
    telephone: formatPhoneIT(d.telephone),
    ...(d.email.trim() ? { email: d.email.trim() } : {}),
    ...(d.image.trim() ? { image: d.image.trim() } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: d.streetAddress.trim(),
      addressLocality: d.locality.trim(),
      postalCode: d.postalCode.trim(),
      addressRegion: d.region.trim() || "BG",
      addressCountry: "IT",
    },
    ...(hours.specs.length ? { openingHoursSpecification: hours.specs } : {}),
    medicalSpecialty: "Dentistry",
    ...(lines(d.services).length
      ? { availableService: lines(d.services).map((s) => ({ "@type": "MedicalProcedure", name: s })) }
      : {}),
    ...(sameAs.length ? { sameAs: sameAs.filter(isHttpUrl) } : {}),
  };

  // "<" scritto come <: un testo con "</script>" non può chiudere il blocco in anticipo.
  const body = JSON.stringify(jsonLd, null, 2).replace(/</g, "\\u003c");
  return { jsonLd, snippet: `<script type="application/ld+json">\n${body}\n</script>`, missing, warnings };
}
