import type { Metadata } from "next";
import Link from "next/link";
import { fetchBusy } from "@/lib/booking/make";
import { generateSlots, groupByDay, removeBusy } from "@/lib/booking/slots";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "Prenota una chiamata — AI Visibility",
  description: "20 minuti al telefono per capire se il vostro studio compare quando un paziente chiede consiglio a ChatGPT.",
  robots: { index: false },
};

const CONTACT_PHONE = "+39 392 111 5365";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function PrenotaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  // Parametri messi nel link dell'email: servono solo a personalizzare il testo,
  // non sono dati riservati (sono gli stessi numeri scritti nell'email).
  const studioId = /^rec[A-Za-z0-9]{14}$/.test(first(sp.s)) ? first(sp.s) : "";
  const studioName = first(sp.studio).slice(0, 120);
  const citazioni = Number.parseInt(first(sp.c), 10);
  const totale = Number.parseInt(first(sp.t), 10);
  const hasNumbers = Number.isFinite(citazioni) && Number.isFinite(totale) && totale > 0 && citazioni >= 0 && citazioni <= totale;

  const all = generateSlots();
  const busy = all.length ? await fetchBusy(all[0].start, all[all.length - 1].end) : [];
  const days = groupByDay(busy ? removeBusy(all, busy) : all);

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "var(--space-8) var(--space-4) var(--space-12)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-8)",
        }}
      >
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Link href="/" style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            AI Visibility · Dalmine
          </Link>
          <h1 style={{ fontSize: "var(--text-2xl)", lineHeight: 1.25, margin: 0, color: "var(--text-primary)" }}>
            {studioName ? `${studioName}: sentiamoci 20 minuti` : "Sentiamoci 20 minuti"}
          </h1>
          {hasNumbers && (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-primary)", lineHeight: "var(--leading-normal)" }}>
              Su <strong>{totale}</strong> domande fatte a ChatGPT, Gemini e Perplexity su dentisti in zona, il vostro studio è
              stato citato <strong>{citazioni === 1 ? "una sola volta" : `${citazioni} volte`}</strong>.
            </p>
          )}
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
            Nella chiamata vi mostro {hasNumbers ? "quali studi escono al vostro posto e perché" : "se il vostro studio viene citato dai motori AI"}, e
            le 3 cose più semplici da sistemare. Nessun impegno: se non vi serve, ve lo dico.
          </p>
        </section>

        {days.length > 0 ? (
          <BookingForm days={days} studioId={studioId} studioName={studioName} />
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
            In questi giorni gli orari sono tutti occupati. Chiamami o scrivimi su WhatsApp al{" "}
            <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} style={{ color: "var(--accent-text)" }}>
              {CONTACT_PHONE}
            </a>{" "}
            e troviamo un momento.
          </p>
        )}

        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Preferisci telefonare tu? {CONTACT_PHONE} — Angelo Marotta
        </p>
      </main>
    </div>
  );
}
