import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ds";

// Pagina pubblica, indipendente dall'area interna: nessun login, nessun prezzo, nessun nome di cliente.
// Il percorso è elencato in PUBLIC_PATHS (src/lib/supabase/middleware.ts).

const CONTACT_NAME = "Angelo Marotta";
const CONTACT_PHONE = "+39 392 111 5365";
const CONTACT_EMAIL = "angelo.marotta4567@gmail.com";

const TITLE = "Ti trovano ChatGPT e Gemini? Misuro come le AI consigliano le attività di Bergamo e provincia e sistemo ciò che manca";

export const metadata: Metadata = {
  title: "Ti trovano ChatGPT e Gemini? — Angelo Marotta",
  description:
    "Misuro quanto spesso ChatGPT, Gemini e Perplexity consigliano la tua attività a Bergamo e provincia, e sistemo ciò che manca: scheda Google, sito, portali e directory.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: CONTACT_NAME,
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  areaServed: { "@type": "AdministrativeArea", name: "Provincia di Bergamo" },
  address: { "@type": "PostalAddress", addressLocality: "Dalmine", addressRegion: "BG", addressCountry: "IT" },
};

const MEASURE = [
  "10 domande, quelle che farebbero i clienti reali: «un buon dentista a Dalmine», «dove faccio una valutazione gratuita della casa».",
  "3 motori: ChatGPT, Gemini e Perplexity.",
  "Ogni domanda ripetuta più volte, perché le risposte delle AI cambiano da una volta all'altra: un solo tentativo non dice niente.",
  "Il risultato è semplice: in quante risposte la tua attività viene citata, e chi viene citato al tuo posto.",
];

const FIX = [
  { title: "Scheda Google", text: "Categoria giusta, orari, foto, servizi, risposte alle recensioni: i dati che le AI e i clienti leggono per primi." },
  { title: "Pagine del sito", text: "Nome, indirizzo, telefono e orari scritti in modo che una macchina li legga senza fraintendere, e una pagina per ogni servizio principale." },
  { title: "Profili sui portali e nelle directory", text: "Gli stessi dati, identici, ovunque compaiate: se una fonte dice una cosa e un'altra ne dice un'altra, le AI si fidano meno." },
];

const sectionTitle = { fontSize: "var(--text-xl)", margin: 0, color: "var(--text-primary)" } as const;
const bodyText = { margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" } as const;

export default function BergamoPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "var(--space-10) var(--space-4) var(--space-12)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-10)",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", lineHeight: 1.2, margin: 0, color: "var(--text-primary)" }}>{TITLE}</h1>
          <p style={bodyText}>
            Sempre più persone chiedono consiglio a un&rsquo;intelligenza artificiale prima ancora di cercare su Google. Se la tua attività non viene nominata, il cliente
            non sa nemmeno che esisti.
          </p>
        </header>

        <section aria-labelledby="misuro" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 id="misuro" style={sectionTitle}>
            Cosa misuro
          </h2>
          <ul style={{ margin: 0, paddingLeft: "var(--space-5)", listStyle: "disc", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {MEASURE.map((m) => (
              <li key={m} style={bodyText}>
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sistemo" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 id="sistemo" style={sectionTitle}>
            Cosa sistemo
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {FIX.map((f) => (
              <div key={f.title}>
                <strong style={{ display: "block", fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{f.title}</strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>{f.text}</span>
              </div>
            ))}
          </div>
          <p style={{ ...bodyText, fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            Non prometto una posizione: le AI non si controllano. Sistemo quello che dipende dalla tua attività e rimisuro, così vedi cosa è cambiato.
          </p>
        </section>

        <section aria-labelledby="esempio" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 id="esempio" style={sectionTitle}>
            Un esempio
          </h2>
          <Card title="Agenzia di Dalmine" kicker="Dati anonimizzati">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-semibold)", color: "var(--data-negative)" }}>11%</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>delle risposte la citano (10 su 89)</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-semibold)", color: "var(--data-negative)" }}>0 su 9</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>sulla domanda «valutazione gratuita»: proprio quella che porta i clienti</span>
              </div>
              <p style={{ ...bodyText, fontSize: "var(--text-sm)" }}>
                Le risposte cambiano nel tempo: i numeri danno un ordine di grandezza, non una cifra esatta. Ed è da questo punto che si parte a sistemare.
              </p>
            </div>
          </Card>
        </section>

        <section aria-labelledby="contatti" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h2 id="contatti" style={sectionTitle}>
            Parliamone
          </h2>
          <strong style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{CONTACT_NAME}</strong>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: "var(--text-base)", color: "var(--accent-text)" }}>
            {CONTACT_EMAIL}
          </a>
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} style={{ fontSize: "var(--text-base)", color: "var(--accent-text)" }}>
            {CONTACT_PHONE}
          </a>
        </section>
      </main>

      <footer style={{ maxWidth: 640, margin: "0 auto", padding: "0 var(--space-4) var(--space-6)" }}>
        <Link href="/privacy" style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Privacy
        </Link>
      </footer>
    </div>
  );
}
