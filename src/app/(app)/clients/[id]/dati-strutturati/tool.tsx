"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button, Card, Input } from "@/components/ds";
import { buildDentistJsonLd, EMPTY_OFFICIAL, type OfficialData } from "@/lib/remediation/dentist-schema";
import type { FieldCheck, SourceReport } from "@/lib/remediation/consistency";
import { checkConsistencyAction } from "../consistency-actions";

type Source = { label: string; url: string; isOwnSite?: boolean; hint?: string };

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 88,
  padding: "var(--space-2) var(--space-3)",
  background: "var(--surface-1)",
  border: "var(--border-width) solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  resize: "vertical",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "var(--space-2)",
  fontSize: "var(--text-xs)",
  color: "var(--text-secondary)",
  fontWeight: "var(--weight-medium)",
};

const hintStyle: React.CSSProperties = { display: "block", marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" };

const STATUS_TONE = { ok: "positive", differente: "negative", non_trovato: "warning" } as const;
const STATUS_LABEL = { ok: "Coincide", differente: "Diverso", non_trovato: "Non trovato" } as const;

function Checks({ checks }: { checks: FieldCheck[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {checks.map((c, i) => (
        <li key={i} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", fontSize: "var(--text-sm)" }}>
          <span style={{ flex: "none", width: 96 }}>
            <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
          </span>
          <span>
            <strong style={{ color: "var(--text-primary)", textTransform: "capitalize" }}>{c.field}</strong>
            <span style={{ color: "var(--text-secondary)" }}> — {c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReportCard({ r }: { r: SourceReport }) {
  const all = [...r.checks, ...(r.structured ?? [])];
  const bad = all.filter((c) => c.status !== "ok").length;
  return (
    <Card
      title={r.label}
      kicker={r.url}
      actions={
        !r.reachable ? (
          <Badge tone="neutral">Non leggibile</Badge>
        ) : bad === 0 ? (
          <Badge tone="positive">Tutto coerente</Badge>
        ) : (
          <Badge tone="negative">{bad === 1 ? "1 cosa da sistemare" : `${bad} cose da sistemare`}</Badge>
        )
      }
    >
      {!r.reachable ? (
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{r.error} Apri la pagina a mano e confronta i dati con quelli ufficiali.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Checks checks={r.checks} />
          {r.structured ? (
            <div>
              <div style={{ ...labelStyle, textTransform: "uppercase", letterSpacing: "var(--tracking-label)", fontSize: "var(--text-2xs)" }}>Dati strutturati del sito</div>
              <Checks checks={r.structured} />
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

export function StructuredDataTool({ clientId, clientName, websiteUrl, city }: { clientId: string; clientName: string; websiteUrl: string; city: string }) {
  const storeKey = `aeo-dati-ufficiali-${clientId}`;
  const [data, setData] = useState<OfficialData>({ ...EMPTY_OFFICIAL, name: clientName, url: websiteUrl, locality: city });
  const [sources, setSources] = useState<Source[]>([
    { label: "Sito dello studio", url: websiteUrl, isOwnSite: true },
    { label: "MioDottore", url: "", hint: "Il link del profilo, es. https://www.miodottore.it/profilo/..." },
    { label: "PagineGialle", url: "", hint: "La scheda dello studio su paginegialle.it" },
    { label: "Altra pagina", url: "", hint: "Facebook, Doctolib, Bing Places, Pagine Bianche..." },
  ]);
  const [copied, setCopied] = useState(false);
  const [reports, setReports] = useState<SourceReport[] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // I dati restano nel browser di chi li scrive (non nel database): comodi per riprendere dopo.
  // Si salva solo dopo il ripristino, altrimenti i campi vuoti iniziali cancellerebbero quelli salvati.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- ripristino una tantum da localStorage dopo il montaggio, per evitare differenze con l'HTML del server */
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const saved = JSON.parse(raw) as { data?: Partial<OfficialData>; sources?: { url: string }[] };
        if (saved.data) setData((d) => ({ ...d, ...saved.data }));
        if (saved.sources) setSources((s) => s.map((x, i) => ({ ...x, url: saved.sources?.[i]?.url ?? x.url })));
      }
    } catch {
      // senza localStorage il modulo funziona lo stesso, solo non ricorda
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storeKey]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ data, sources: sources.map((s) => ({ url: s.url })) }));
    } catch {
      // vedi sopra
    }
  }, [restored, storeKey, data, sources]);

  const result = useMemo(() => buildDentistJsonLd(data), [data]);
  const set = (k: keyof OfficialData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData((d) => ({ ...d, [k]: e.target.value }));

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([result.snippet], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dati-strutturati-studio.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function runCheck() {
    setCheckError(null);
    setReports(null);
    startTransition(async () => {
      try {
        const res = await checkConsistencyAction(clientId, data, sources.map(({ label, url, isOwnSite }) => ({ label, url, isOwnSite })));
        if (res.ok) setReports(res.reports);
        else setCheckError(res.error);
      } catch {
        setCheckError("Il controllo non è riuscito. Riprova tra un minuto.");
      }
    });
  }

  const officialReady = Boolean(data.name.trim() && data.streetAddress.trim() && data.telephone.trim());

  return (
    <>
      <Card kicker="Come funziona" title="In parole semplici">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)", maxWidth: "80ch" }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>Cosa sono i dati strutturati.</strong> Sono il biglietto da visita dello studio scritto in un formato che un computer legge senza dover indovinare:
            nome, indirizzo, telefono, orari. Si inseriscono nel sito e il visitatore non li vede.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>Perché contano.</strong> Le AI incrociano le fonti. Se l&rsquo;indirizzo è «Via Roma 12» su Google e «V. Roma, 12/A» su MioDottore, sono meno sicure e citano un altro studio.
            Per questo i dati si scrivono una volta sola, con il titolare, e si copiano da qui ovunque.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>Cosa fai.</strong> 1) Compili i dati ufficiali qui sotto con il titolare. 2) Copi il blocco nel sito (o lo mandi a chi lo gestisce). 3) Premi «Controlla coerenza». 4) Correggi i profili che risultano diversi.
            Il testo clinico e ogni testo pubblicato li approva il titolare per iscritto: qui ci sono solo dati pubblici dello studio, mai dati di pazienti.
          </p>
        </div>
      </Card>

      <Card kicker="Passo 1" title="Dati ufficiali dello studio">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
          <Input label="Nome identico all'insegna" value={data.name} onChange={set("name")} placeholder="Studio Dentistico ..." hint="Senza parole aggiunte (niente «Dentista Dalmine Impianti»)." />
          <Input label="Sito" value={data.url} onChange={set("url")} placeholder="https://www..." />
          <Input label="Telefono" value={data.telephone} onChange={set("telephone")} placeholder="035 000000" />
          <Input label="Email (facoltativa)" value={data.email} onChange={set("email")} placeholder="info@..." />
          <Input label="Via e numero civico" value={data.streetAddress} onChange={set("streetAddress")} placeholder="Via Roma 12" hint="Come sull'insegna, es. «Viale Natale Betelli 23/A»." />
          <Input label="CAP" value={data.postalCode} onChange={set("postalCode")} placeholder="24044" />
          <Input label="Comune" value={data.locality} onChange={set("locality")} placeholder="Dalmine" />
          <Input label="Provincia" value={data.region} onChange={set("region")} placeholder="BG" />
          <Input label="Foto dello studio (indirizzo del file, facoltativo)" value={data.image} onChange={set("image")} placeholder="https://.../foto-studio.jpg" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
          <label>
            <span style={labelStyle}>Orari (una riga per fascia)</span>
            <textarea value={data.hours} onChange={set("hours")} placeholder={"lun-ven 09:00-13:00, 14:30-19:00\nsab 09:00-12:00"} style={textareaStyle} />
            <span style={hintStyle}>Giorni: lun, mar, mer, gio, ven, sab, dom. Chiusure e festività non vanno qui.</span>
          </label>
          <label>
            <span style={labelStyle}>Trattamenti principali (uno per riga)</span>
            <textarea value={data.services} onChange={set("services")} placeholder={"Igiene dentale\nImplantologia\nOrtodonzia"} style={textareaStyle} />
            <span style={hintStyle}>Solo quelli che lo studio fa davvero, in ordine di importanza.</span>
          </label>
          <label>
            <span style={labelStyle}>Profili collegati (un link per riga)</span>
            <textarea value={data.sameAs} onChange={set("sameAs")} placeholder={"https://www.miodottore.it/profilo/...\nhttps://www.facebook.com/..."} style={textareaStyle} />
            <span style={hintStyle}>MioDottore, Facebook, scheda Google: dicono alle AI che sono lo stesso studio.</span>
          </label>
        </div>
      </Card>

      <Card
        kicker="Passo 2"
        title="Blocco da inserire nel sito"
        actions={
          result.jsonLd ? (
            <>
              <Button size="sm" variant="secondary" onClick={copy}>
                {copied ? "Copiato" : "Copia"}
              </Button>
              <Button size="sm" variant="ghost" onClick={download}>
                Scarica
              </Button>
            </>
          ) : null
        }
      >
        {result.missing.length > 0 ? (
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            Per generare il blocco mancano: <strong>{result.missing.join(", ")}</strong>.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <pre
              style={{
                margin: 0,
                padding: "var(--space-3)",
                background: "var(--bg-sunken)",
                border: "var(--border-width) solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                overflow: "auto",
                maxHeight: 360,
                whiteSpace: "pre",
              }}
            >
              {result.snippet}
            </pre>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Dove incollarlo</strong>
              <span>• WordPress: con un plugin che permette di inserire codice nell&rsquo;intestazione (head), o con il plugin SEO dei dati dell&rsquo;attività locale.</span>
              <span>• Sito gestito da un&rsquo;agenzia: mandi il file con una riga, «da inserire nell&rsquo;head della homepage».</span>
              <span>• Wix, Squarespace e simili: sezione per il codice personalizzato o per le informazioni SEO.</span>
              <span>
                • Poi verifica: incolla l&rsquo;indirizzo del sito su <code>validator.schema.org</code> e nel Test dei risultati multimediali di Google. Zero errori, prima di dire che è fatto.
              </span>
            </div>
          </div>
        )}
        {result.warnings.length > 0 ? (
          <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ ...labelStyle, textTransform: "uppercase", letterSpacing: "var(--tracking-label)", fontSize: "var(--text-2xs)" }}>Da controllare prima di pubblicare</div>
            {result.warnings.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                <Badge tone="warning">Attenzione</Badge>
                <span>{w}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card kicker="Passo 3" title="Controlla coerenza" actions={<Button size="sm" onClick={runCheck} disabled={pending || !officialReady}>{pending ? "Controllo in corso…" : "Controlla coerenza"}</Button>}>
        <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--text-sm)", maxWidth: "80ch" }}>
          Il software apre le pagine che indichi e cerca nome, indirizzo e telefono. Per il sito controlla anche i dati strutturati già presenti. La scheda Google non si legge da fuori: confrontala a occhio.
          {!officialReady ? " Compila prima nome, via e telefono." : ""}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {sources.map((s, i) => (
            <Input
              key={s.label}
              label={s.label}
              value={s.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSources((all) => all.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              placeholder="https://..."
              hint={s.hint}
            />
          ))}
        </div>
      </Card>

      {checkError ? (
        <Card>
          <p style={{ margin: 0, color: "var(--data-negative)" }}>{checkError}</p>
        </Card>
      ) : null}

      {reports ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {reports.length === 0 ? (
            <Card>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>Inserisci almeno un link da controllare.</p>
            </Card>
          ) : (
            reports.map((r) => <ReportCard key={r.label + r.url} r={r} />)
          )}
          <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-xs)", maxWidth: "80ch" }}>
            Limiti: il controllo legge il testo della pagina così com&rsquo;è scaricata. Se una pagina carica i dati con JavaScript o blocca le letture automatiche può risultare «Non trovato» anche se a video i dati ci sono: in quel caso verifica a mano.
          </p>
        </div>
      ) : null}
    </>
  );
}
