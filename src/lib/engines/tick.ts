import "server-only";

function baseUrl() {
  return process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
}

/** Innesca (o fa proseguire) l'esecuzione server-side di un ciclo di
 * misurazione chiamando /api/measurement/tick, che poi si richiama da sola
 * finché il ciclo non è completo -- vedi quella rotta per il perché. Va
 * sempre chiamata dentro after(), sia da un Server Action (avvio ciclo) sia
 * dalla rotta stessa (continuazione), così non blocca la risposta a chi ha
 * chiamato. */
export async function triggerMeasurementTick(cycleId: string): Promise<void> {
  try {
    await fetch(`${baseUrl()}/api/measurement/tick`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ cycleId }),
    });
  } catch (err) {
    console.error(`[measurement-tick] non riuscito a innescare il tick per ${cycleId}:`, err);
  }
}
