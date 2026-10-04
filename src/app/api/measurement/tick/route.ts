import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runMeasurementCycleChunk } from "@/lib/engines/run-cycle";
import { triggerMeasurementTick } from "@/lib/engines/tick";

export const maxDuration = 60;

// Un job può arrivare a ~90s nel caso peggiore (2 tentativi da 45s).
const LOCK_MS = 100_000;

/** Esegue un blocco di un ciclo di misurazione lato server e, se non è
 * finito, si richiama da sola (server-to-server, via after()) per continuare
 * -- indipendentemente da qualunque pagina del browser aperta. Protetta da
 * CRON_SECRET: senza questo, chiunque potrebbe far avanzare misurazioni a
 * piacere consumando le chiamate a pagamento verso i motori AI. */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { cycleId } = (await req.json()) as { cycleId?: string };
  if (!cycleId) {
    return Response.json({ error: "cycleId mancante" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Un solo esecutore per ciclo: l'UPDATE condizionale è atomico, quindi se
  // due tick arrivano insieme solo uno ottiene il blocco. Gli altri escono
  // subito senza fare nulla -- chi ha il blocco richiamerà il prossimo tick.
  // Il blocco scade da solo (LOCK_MS) se un esecutore muore a metà.
  const now = new Date();
  const { data: claimed, error: lockError } = await supabase
    .from("measurement_cycles")
    .update({ locked_until: new Date(now.getTime() + LOCK_MS).toISOString() })
    .eq("id", cycleId)
    .eq("status", "running")
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select("id");
  if (lockError) throw new Error(lockError.message);
  if (!claimed || claimed.length === 0) {
    return Response.json({ done: false, busy: true }, { status: 202 });
  }

  let result;
  try {
    result = await runMeasurementCycleChunk({ supabase, cycleId });
  } finally {
    await supabase.from("measurement_cycles").update({ locked_until: null }).eq("id", cycleId);
  }

  if (!result.done) {
    after(() => triggerMeasurementTick(cycleId));
  }

  return Response.json(result);
}
