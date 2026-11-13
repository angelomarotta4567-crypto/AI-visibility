import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Check, Globe, Mail, MapPin, MessageCircle, Phone, RefreshCw, Search, ShieldCheck, Star, Wrench, X } from "lucide-react";

// Pagina pubblica, indipendente dall'area interna: nessun login, nessun prezzo, nessun nome di cliente.
// Le illustrazioni sono disegnate qui (HTML/SVG con i colori del tema): niente immagini da caricare.
// Il percorso è elencato in PUBLIC_PATHS (src/lib/supabase/middleware.ts).

const CONTACT_NAME = "Angelo Marotta";
const CONTACT_PHONE = "+39 392 111 5365";
const CONTACT_EMAIL = "angelo.marotta4567@gmail.com";
const TEL_HREF = `tel:${CONTACT_PHONE.replace(/\s/g, "")}`;

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

// ---------- stili condivisi ----------
const WRAP: CSSProperties = { maxWidth: 1040, margin: "0 auto", padding: "0 var(--space-4)" };
const H2: CSSProperties = { fontSize: "clamp(1.5rem, 4vw, 2.1rem)", lineHeight: 1.15, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.01em" };
const LEAD: CSSProperties = { margin: 0, fontSize: "clamp(1rem, 2.4vw, 1.125rem)", color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: "58ch" };
const CAPTION: CSSProperties = { margin: "var(--space-3) 0 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.5 };
const CARD: CSSProperties = {
  background: "var(--surface-1)",
  border: "var(--border-width) solid var(--border-subtle)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-sm)",
  overflow: "hidden",
};

function Section({ id, eyebrow, title, intro, children, tint = false }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode; tint?: boolean }) {
  return (
    <section
      aria-labelledby={id}
      style={{ background: tint ? "var(--bg-sunken)" : "transparent", padding: "clamp(40px, 8vw, 80px) 0", borderTop: tint ? "var(--border-width) solid var(--border-subtle)" : undefined, borderBottom: tint ? "var(--border-width) solid var(--border-subtle)" : undefined }}
    >
      <div style={{ ...WRAP, display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <span style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--accent-text)", fontWeight: "var(--weight-semibold)" }}>{eyebrow}</span>
          <h2 id={id} style={H2}>
            {title}
          </h2>
          {intro ? <p style={LEAD}>{intro}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function IconBadge({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "positive" | "negative" }) {
  const bg = tone === "positive" ? "var(--data-positive-subtle)" : tone === "negative" ? "var(--data-negative-subtle)" : "var(--accent-subtle)";
  const fg = tone === "positive" ? "var(--data-positive)" : tone === "negative" ? "var(--data-negative)" : "var(--accent-text)";
  return (
    <span style={{ width: 40, height: 40, flex: "none", borderRadius: "var(--radius-pill)", background: bg, color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{children}</span>
  );
}

function Button({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        height: 48,
        padding: "0 var(--space-5)",
        borderRadius: "var(--radius-pill)",
        background: primary ? "var(--accent)" : "transparent",
        color: primary ? "var(--text-on-accent)" : "var(--text-primary)",
        border: primary ? "var(--border-width) solid transparent" : "var(--border-width) solid var(--border-strong)",
        fontWeight: "var(--weight-semibold)",
        fontSize: "var(--text-base)",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

// ---------- illustrazioni ----------

/** Come la vede un cliente: la risposta di un'AI con tre attività consigliate, e la tua che non c'è. */
function ChatMock() {
  const rank = (n: number) => (
    <span style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--accent-subtle)", color: "var(--accent-text)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{n}</span>
  );
  const stars = (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 1, color: "var(--data-warning)" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ ...CARD, boxShadow: "var(--shadow-popover)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)", borderBottom: "var(--border-width) solid var(--border-subtle)", background: "var(--surface-2)" }}>
          <MessageCircle size={16} color="var(--accent-text)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>Assistente AI</span>
          <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>esempio</span>
        </div>
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ alignSelf: "flex-end", maxWidth: "85%", background: "var(--accent)", color: "var(--text-on-accent)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)", fontSize: "var(--text-sm)" }}>
            Mi consigli un buon idraulico a Dalmine?
          </div>
          <div style={{ alignSelf: "flex-start", width: "100%", background: "var(--surface-2)", padding: "var(--space-3)", borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Ecco 3 attività che ti consiglio:</span>
            {["Idraulica A", "Idraulica B", "Idraulica C"].map((n, i) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                {rank(i + 1)}
                <strong style={{ fontWeight: "var(--weight-medium)" }}>{n}</strong>
                {stars}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)", padding: "var(--space-2) var(--space-3)", border: "var(--border-width) dashed var(--data-negative)", borderRadius: "var(--radius-md)", background: "var(--data-negative-subtle)", fontSize: "var(--text-sm)", color: "var(--data-negative)" }}>
              <X size={16} />
              <span>
                <strong>La tua attività</strong> non compare
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption style={CAPTION}>
        <strong style={{ color: "var(--text-primary)" }}>Così sceglie un cliente oggi.</strong> Chiede all&rsquo;AI e va dalle attività che nomina. Se la tua non è nell&rsquo;elenco, per lui non esiste.
      </figcaption>
    </figure>
  );
}

/** Il calcolo della misura: 10 domande × 3 motori × 3 volte = 90 risposte. */
function Formula() {
  const tile = (big: string, small: string, hint: string) => (
    <div style={{ ...CARD, padding: "var(--space-4)", textAlign: "center", flex: "1 1 130px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "clamp(2rem, 6vw, 2.75rem)", fontWeight: "var(--weight-semibold)", color: "var(--accent-text)", lineHeight: 1 }}>{big}</span>
      <strong style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{small}</strong>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.4 }}>{hint}</span>
    </div>
  );
  const op = (s: string) => (
    <span aria-hidden="true" style={{ fontSize: "var(--text-2xl)", color: "var(--text-tertiary)", alignSelf: "center" }}>{s}</span>
  );
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "stretch" }}>
        {tile("10", "domande", "quelle che farebbero i tuoi clienti")}
        {op("×")}
        {tile("3", "motori AI", "ChatGPT, Gemini, Perplexity")}
        {op("×")}
        {tile("3", "volte", "perché le AI non rispondono sempre uguale")}
        {op("=")}
        <div style={{ ...CARD, padding: "var(--space-4)", textAlign: "center", flex: "1 1 150px", background: "var(--accent)", borderColor: "transparent", display: "flex", flexDirection: "column", gap: 2, justifyContent: "center" }}>
          <span style={{ fontSize: "clamp(2rem, 6vw, 2.75rem)", fontWeight: "var(--weight-semibold)", color: "var(--text-on-accent)", lineHeight: 1 }}>90</span>
          <strong style={{ fontSize: "var(--text-base)", color: "var(--text-on-accent)" }}>risposte</strong>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-on-accent)", opacity: 0.85 }}>per ogni attività</span>
        </div>
      </div>
      <figcaption style={CAPTION}>
        <strong style={{ color: "var(--text-primary)" }}>Alla fine conto</strong> in quante delle 90 risposte compare il nome della tua attività. È la tua percentuale di citazione.
      </figcaption>
    </figure>
  );
}

/** Esempi di domande dei clienti, come fumetti. */
function QuestionChips() {
  const qs = ["Idraulico urgente a Dalmine", "Migliore pasticceria di Bergamo", "Dove faccio una valutazione gratuita della casa?", "Parrucchiere aperto il sabato a Treviolo"];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {qs.map((q) => (
          <span key={q} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", background: "var(--surface-1)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
            <Search size={14} color="var(--text-tertiary)" />
            {q}
          </span>
        ))}
      </div>
      <p style={CAPTION}>Esempi di domande: le scelgo con te, sul tuo mestiere e sulla tua zona.</p>
    </div>
  );
}

function Check1({ children }: { children: ReactNode }) {
  return (
    <li style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.45 }}>
      <Check size={16} color="var(--data-positive)" style={{ flex: "none", marginTop: 2 }} />
      <span>{children}</span>
    </li>
  );
}

function FixCard({ title, mock, points, caption }: { title: string; mock: ReactNode; points: string[]; caption: string }) {
  return (
    <article style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--surface-2)", padding: "var(--space-5) var(--space-4)", minHeight: 270, display: "flex", justifyContent: "center", alignItems: "center", borderBottom: "var(--border-width) solid var(--border-subtle)" }}>{mock}</div>
      <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)", flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-lg)", color: "var(--text-primary)" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.5 }}>{caption}</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {points.map((p) => (
            <Check1 key={p}>{p}</Check1>
          ))}
        </ul>
      </div>
    </article>
  );
}

const bar = (w: string, h = 8, strong = false): CSSProperties => ({ width: w, height: h, borderRadius: 4, background: strong ? "var(--text-tertiary)" : "var(--border-default)" });

/** Scheda Google: nome, voti, orari, pulsanti, foto. */
function GoogleMock() {
  return (
    <div role="img" aria-label="Disegno di una scheda Google con nome, stelle, orari e foto" style={{ width: "100%", maxWidth: 260, background: "var(--surface-1)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, padding: 3 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 52, borderRadius: 6, background: i === 0 ? "var(--accent-subtle)" : "var(--surface-3)" }} />
        ))}
      </div>
      <div style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={bar("70%", 12, true)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
          <strong>4,8</strong>
          <span aria-hidden="true" style={{ display: "inline-flex", gap: 1, color: "var(--data-warning)" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
          <span>(127)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)" }}>
          <span style={{ color: "var(--data-positive)", fontWeight: "var(--weight-semibold)" }}>Aperto</span>
          <span style={{ color: "var(--text-secondary)" }}>chiude alle 19:00</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
          <MapPin size={12} />
          <div style={bar("60%")} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          {["Chiama", "Indicazioni"].map((b) => (
            <span key={b} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: "var(--radius-pill)", border: "var(--border-width) solid var(--accent-border)", color: "var(--accent-text)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)" }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pagina del sito, con i dati "leggibili dalle AI". */
function SiteMock() {
  return (
    <div role="img" aria-label="Disegno di una pagina del sito con i dati dell'attività leggibili dalle AI" style={{ width: "100%", maxWidth: 260, background: "var(--surface-1)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 10px", background: "var(--surface-3)" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border-strong)" }} />
        ))}
        <span style={{ marginLeft: 6, flex: 1, display: "flex", alignItems: "center", gap: 4, background: "var(--surface-1)", borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "var(--text-tertiary)" }}>
          <Globe size={10} />
          iltuosito.it
        </span>
      </div>
      <div style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={bar("55%", 12, true)} />
        <div style={bar("95%")} />
        <div style={bar("80%")} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "4px 0" }}>
          {["Servizio 1", "Servizio 2", "Servizio 3"].map((s) => (
            <span key={s} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-secondary)", border: "var(--border-width) solid var(--border-subtle)" }}>{s}</span>
          ))}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.5, padding: "8px 10px", borderRadius: 8, background: "var(--bg-sunken)", border: "var(--border-width) dashed var(--accent-border)", color: "var(--accent-text)" }}>
          {"{ nome: …,"}
          <br />
          {"  indirizzo: …,"}
          <br />
          {"  orari: … }"}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center" }}>dati che le AI leggono senza dubbi</span>
      </div>
    </div>
  );
}

/** Tre portali con gli stessi dati, uniti da un segno di spunta. */
function ProfilesMock() {
  const tile = (name: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-1)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "8px 10px", boxShadow: "var(--shadow-sm)" }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-subtle)", color: "var(--accent-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <MapPin size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{name}</span>
        <div style={bar("85%", 7, true)} />
        <div style={bar("60%", 6)} />
      </div>
      <Check size={16} color="var(--data-positive)" />
    </div>
  );
  return (
    <div role="img" aria-label="Disegno di tre profili con gli stessi dati su portali e directory" style={{ width: "100%", maxWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
      {tile("Portale di settore")}
      {tile("Directory locale")}
      {tile("Mappe")}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--data-positive)", fontWeight: "var(--weight-semibold)" }}>
        <ShieldCheck size={14} />
        Stessi dati ovunque
      </div>
    </div>
  );
}

function Steps() {
  const steps = [
    { icon: <Search size={20} />, title: "Misuro", text: "Faccio alle AI le domande dei tuoi clienti e conto quante volte ti nominano." },
    { icon: <Wrench size={20} />, title: "Sistemo", text: "Metto in ordine scheda Google, sito e portali: ciò che le AI leggono su di te." },
    { icon: <RefreshCw size={20} />, title: "Rimisuro", text: "Ripeto la misura e ti mostro cosa è cambiato, con i numeri." },
  ];
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
      {steps.map((s, i) => (
        <li key={s.title} style={{ ...CARD, padding: "var(--space-4)", display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
          <IconBadge>{s.icon}</IconBadge>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)" }}>Passo {i + 1}</span>
            <strong style={{ display: "block", fontSize: "var(--text-lg)", color: "var(--text-primary)", margin: "2px 0 4px" }}>{s.title}</strong>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.text}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function BergamoPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Intestazione */}
      <div style={{ background: "radial-gradient(900px 420px at 85% -10%, var(--accent-subtle), transparent 70%)" }}>
        <div style={{ ...WRAP, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(32px, 6vw, 64px)", alignItems: "center", padding: "clamp(32px, 7vw, 72px) var(--space-4)" }}>
          <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-1)", border: "var(--border-width) solid var(--border-default)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              <MapPin size={12} />
              Bergamo e provincia
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(1.9rem, 5.2vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{TITLE}</h1>
            <p style={LEAD}>Sempre più persone chiedono consiglio a un&rsquo;intelligenza artificiale prima ancora di cercare su Google. Io controllo se nomina anche te.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <Button href={TEL_HREF} primary>
                <Phone size={18} />
                Chiamami
              </Button>
              <Button href={`mailto:${CONTACT_EMAIL}`}>
                <Mail size={18} />
                Scrivimi
              </Button>
            </div>
          </header>
          <ChatMock />
        </div>
      </div>

      {/* In 3 passi */}
      <Section id="come" eyebrow="Come funziona" title="Tre passi, tutti miei">
        <Steps />
      </Section>

      {/* Cosa misuro */}
      <Section id="misuro" eyebrow="1 · Misuro" title="Cosa misuro" intro="Faccio alle AI le domande che farebbero i tuoi clienti, e conto quante volte nominano la tua attività." tint>
        <QuestionChips />
        <Formula />
      </Section>

      {/* Cosa sistemo */}
      <Section id="sistemo" eyebrow="2 · Sistemo" title="Cosa sistemo" intro="Le AI imparano chi sei da tre posti. Se in uno di questi mancano dati o sono diversi, si fidano meno e nominano un altro.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-5)" }}>
          <FixCard
            title="La scheda Google"
            mock={<GoogleMock />}
            caption="È la prima cosa che vede chi ti cerca, persona o AI."
            points={["Categoria e orari giusti, anche per le feste", "Foto e servizi aggiornati", "Risposte alle recensioni"]}
          />
          <FixCard
            title="Le pagine del sito"
            mock={<SiteMock />}
            caption="Il sito deve dire alle AI, senza ambiguità, chi sei e cosa fai."
            points={["Nome, indirizzo e orari leggibili da una macchina", "Una pagina per ogni servizio principale", "Risposte alle domande più comuni"]}
          />
          <FixCard
            title="Portali e directory"
            mock={<ProfilesMock />}
            caption="Gli stessi dati, identici, in ogni posto dove compari."
            points={["Un solo indirizzo e telefono, scritti sempre uguali", "Profili completi sui portali del tuo settore", "Directory locali e mappe allineate"]}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", padding: "var(--space-4)", background: "var(--surface-2)", borderRadius: "var(--radius-lg)", border: "var(--border-width) solid var(--border-subtle)" }}>
          <IconBadge>
            <ShieldCheck size={20} />
          </IconBadge>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--text-primary)" }}>Non prometto una posizione:</strong> le AI non si controllano. Sistemo quello che dipende dalla tua attività e rimisuro, così vedi cosa è cambiato.
          </p>
        </div>
      </Section>

      {/* Contatti */}
      <Section id="contatti" eyebrow="Parliamone" title="Vuoi sapere se le AI ti nominano?" tint>
        <div style={{ ...CARD, padding: "clamp(20px, 4vw, 32px)", display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- immagine statica in public/, next/image è overkill qui */}
          <img src="/angelo.jpeg" alt={CONTACT_NAME} width={96} height={96} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <strong style={{ fontSize: "var(--text-xl)", color: "var(--text-primary)" }}>{CONTACT_NAME}</strong>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Dalmine · lavoro con le attività di Bergamo e provincia</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              <Button href={TEL_HREF} primary>
                <Phone size={18} />
                {CONTACT_PHONE}
              </Button>
              <Button href={`mailto:${CONTACT_EMAIL}`}>
                <Mail size={18} />
                {CONTACT_EMAIL}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <footer style={{ ...WRAP, paddingBottom: "var(--space-8)" }}>
        <Link href="/privacy" style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Privacy
        </Link>
      </footer>
    </div>
  );
}
