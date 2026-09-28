import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runMeasurementCycleChunk } from "@/lib/engines/run-cycle";
import { triggerMeasurementTick } from "@/lib/engines/tick";

export const maxDuration = 60;

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
  const result = await runMeasurementCycleChunk({ supabase, cycleId });

  if (!result.done) {
    after(() => triggerMeasurementTick(cycleId));
  }

  return Response.json(result);
}
