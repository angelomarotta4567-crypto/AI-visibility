import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chiamata prenotata — AI Visibility",
  robots: { index: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ConfermataPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const quando = (Array.isArray(sp.quando) ? sp.quando[0] : sp.quando)?.slice(0, 80) ?? "";

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "var(--space-12) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0, color: "var(--text-primary)" }}>Fatto, ci sentiamo!</h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
          {quando ? (
            <>
              Ti chiamo <strong style={{ color: "var(--text-primary)" }}>{quando}</strong> al numero che mi hai lasciato.
            </>
          ) : (
            "Ti chiamo all'orario che hai scelto, al numero che mi hai lasciato."
          )}{" "}
          Se hai lasciato l&apos;email ti arriva anche l&apos;invito in calendario.
        </p>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Imprevisto? Scrivimi o chiamami al +39 392 111 5365. — Angelo
        </p>
        <Link href="/" style={{ fontSize: "var(--text-sm)", color: "var(--accent-text)" }}>
          Torna alla home
        </Link>
      </main>
    </div>
  );
}
