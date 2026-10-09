import Link from "next/link";
import { Card } from "@/components/ds";

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        padding: "var(--space-6) var(--space-4)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Link href="/" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          ← Torna alla home
        </Link>
        <Card title="Privacy">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
            <p style={{ margin: 0 }}>
              Questa pagina descrive i dati raccolti visitando questo sito. Titolare del trattamento: Angelo
              Marotta, Dalmine (BG).
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Cosa non raccogliamo.</strong> Questo sito non usa
              cookie di profilazione né strumenti di tracciamento pubblicitario.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Prenotazione di una chiamata.</strong> Se usate la
              pagina &ldquo;Prenota una chiamata&rdquo;, raccogliamo nome, studio, telefono, email (facoltativa),
              eventuali note e l&rsquo;orario scelto. Base giuridica: la vostra richiesta di essere ricontattati
              (art. 6.1.b GDPR). I dati servono solo a fissare e fare la chiamata: finiscono nel calendario Google e
              in un archivio Airtable di Angelo Marotta, passando per l&rsquo;automazione Make (fornitori che li
              trattano per suo conto). Li conserviamo al massimo 12 mesi se non diventate clienti. Potete chiederne
              in ogni momento la copia, la correzione o la cancellazione scrivendo ad Angelo Marotta.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Email e fogli informativi.</strong> Scriviamo via
              email solo agli studi che ce lo hanno chiesto (di persona o al telefono). Il foglio con il codice QR
              lasciato in studio o spedito per posta contiene solo dati pubblici dello studio. Basta dire o
              rispondere &ldquo;no grazie&rdquo; e non vi ricontatteremo.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Contatti diretti.</strong> Se scrivete via telefono,
              WhatsApp o email, quei dati (numero, indirizzo email, contenuto del messaggio) restano tra voi e
              Angelo Marotta, usati solo per rispondervi — non vengono condivisi con terzi né usati per altri scopi.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Le misurazioni.</strong> Il servizio descritto in
              questa pagina misura la presenza di un&rsquo;azienda nelle risposte dei motori AI usando domande
              sintetiche, concordate col cliente — non dati raccolti da utenti finali reali.
            </p>
            <p style={{ margin: 0 }}>
              Per qualunque domanda su questi dati potete scrivere direttamente ad Angelo Marotta.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
