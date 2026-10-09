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
  // Facoltativi: lo studio più consigliato nella stessa misurazione (dalla Fotografia / dal foglio QR).
  const winner = first(sp.w).slice(0, 80);
  const winnerCount = Number.parseInt(first(sp.wc), 10);
  const hasWinner = hasNumbers && winner !== "" && Number.isFinite(winnerCount) && winnerCount > citazioni && winnerCount <= totale;

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
            Essere primi su Google non vuol dire essere consigliati da ChatGPT
          </h1>
          {hasNumbers ? (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-primary)", lineHeight: "var(--leading-normal)" }}>
              Su <strong>{totale}</strong> risposte di ChatGPT, Gemini e Perplexity a domande come «un buon dentista a
              Dalmine»{hasWinner ? (
                <>
                  , <strong>{winner}</strong> è stato consigliato <strong>{winnerCount} volte</strong>.{" "}
                  {studioName || "Il vostro studio"}:{" "}
                  <strong style={{ color: "var(--data-negative)" }}>{citazioni === 1 ? "una volta" : `${citazioni} volte`}</strong>.
                </>
              ) : (
                <>
                  , {studioName || "il vostro studio"} è stato consigliato{" "}
                  <strong>{citazioni === 1 ? "una sola volta" : `${citazioni} volte`}</strong>.
                </>
              )}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-primary)", lineHeight: "var(--leading-normal)" }}>
              Sempre più pazienti chiedono a un&rsquo;intelligenza artificiale «un buon dentista vicino a me».
              {studioName ? ` ${studioName} viene consigliato?` : " Il vostro studio viene consigliato?"} Lo controllo gratis.
            </p>
          )}
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
            In 20 minuti al telefono vi mostro {hasNumbers ? "chi esce al vostro posto e perché" : "cosa rispondono le AI su di voi"} e
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
