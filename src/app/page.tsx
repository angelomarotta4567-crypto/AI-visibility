import Link from "next/link";
import { Card } from "@/components/ds";

const CONTACT_PHONE = "+39 392 111 5365";
const CONTACT_EMAIL = "angelo.marotta4567@gmail.com";

const PHASES = [
  { n: "1", title: "Diagnosi", text: "Controlliamo se il vostro sito è leggibile dai motori AI, non solo dalle persone." },
  { n: "2", title: "Misurazione", text: "Facciamo decine di domande reali ai motori AI, più volte, e registriamo chi viene citato." },
  { n: "3", title: "Intervento", text: "Sistemiamo scheda Google, scheda MioDottore, dati sul sito e recensioni — il lavoro lo facciamo noi." },
  { n: "4", title: "Verifica", text: "Ripetiamo la misurazione e mostriamo cos'è cambiato, con i limiti del dato sempre in chiaro." },
];

const EXAMPLE_ACTIONS = [
  "Scheda Google Business completa: orari, foto, categoria corretta",
  "Scheda MioDottore aggiornata — è la fonte più citata dai motori AI per i dentisti",
  "Dati sul sito leggibili da un'AI, non solo da una persona (nome, indirizzo, orari)",
  "Recensioni recenti, almeno una o due al mese",
  "Una pagina dedicata per ogni trattamento principale (impianti, urgenze, bambini...)",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Angelo Marotta",
  url: "https://ai-visibility-ai-sales2.vercel.app",
  email: CONTACT_EMAIL,
  address: { "@type": "PostalAddress", addressLocality: "Dalmine", addressRegion: "BG", addressCountry: "IT" },
};

export default function PublicHomePage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-4) var(--space-4)",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Dalmine</span>
        <Link href="/accedi" style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Team interno
        </Link>
      </header>

      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "var(--space-6) var(--space-4) var(--space-12)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-10)",
        }}
      >
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", lineHeight: 1.2, margin: 0, color: "var(--text-primary)" }}>
            Quando un paziente chiede a ChatGPT il miglior dentista a Dalmine, compari?
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", margin: 0, lineHeight: "var(--leading-normal)" }}>
            Sempre più persone chiedono consiglio a un&rsquo;intelligenza artificiale prima ancora di cercare su
            Google. Controllo se il vostro studio viene citato, e se non lo è vi aiuto a sistemarlo.
          </p>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {PHASES.map((p) => (
            <div key={p.n} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
              <span
                style={{
                  flex: "none",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--accent-subtle)",
                  color: "var(--accent-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {p.n}
              </span>
              <div>
                <strong style={{ display: "block", fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{p.title}</strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{p.text}</span>
              </div>
            </div>
          ))}
        </section>

        <section>
          <Card title="Un esempio reale (dati anonimizzati)" kicker="Studio A — dentista, provincia di Bergamo">
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", margin: "0 0 var(--space-4)" }}>
              <span style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-semibold)", color: "var(--data-negative)" }}>0%</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                citato su 120 domande fatte ai motori AI su &ldquo;dentista a Dalmine&rdquo; e simili
              </span>
            </div>
            <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
              Al suo posto uscivano sempre gli stessi due-tre studi della zona, con un sito o una scheda più
              completa. Le prime 5 cose da fare, in ordine di impatto:
            </p>
            <ol style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {EXAMPLE_ACTIONS.map((a) => (
                <li key={a} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  {a}
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <section style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- immagine statica in public/, next/image è overkill qui */}
          <img
            src="/angelo.jpeg"
            alt="Angelo Marotta"
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flex: "none" }}
          />
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
            Sono Angelo, di Dalmine. Controllo e miglioro quanto le attività locali vengono trovate dalle
            intelligenze artificiali quando qualcuno cerca un consiglio.
          </p>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <strong style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>Parliamone</strong>
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} style={{ fontSize: "var(--text-base)", color: "var(--accent-text)" }}>
            {CONTACT_PHONE}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: "var(--text-base)", color: "var(--accent-text)" }}>
            {CONTACT_EMAIL}
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
