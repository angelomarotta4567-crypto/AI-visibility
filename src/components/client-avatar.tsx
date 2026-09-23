/** Logo del cliente se presente, altrimenti un cerchio con l'iniziale --
 * usato ovunque compaia il nome di un cliente (lista clienti, scheda
 * cliente) per riconoscerlo a colpo d'occhio, non solo dal nome testuale. */
export function ClientAvatar({ name, logoUrl, size = 24 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL esterni arbitrari forniti dall'utente, non ottimizzabili da next/image senza configurare i domini in anticipo.
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", flex: "none", border: "var(--border-width) solid var(--border-subtle)" }}
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "var(--radius-sm)",
        background: "var(--accent-subtle)",
        color: "var(--accent-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.45,
        fontWeight: "var(--weight-semibold)",
      }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
