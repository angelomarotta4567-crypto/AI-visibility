import "server-only";

const TIMEOUT_MS = 8000;
const USER_AGENT = "AEO-Diagnosis-Bot/1.0 (+internal visibility audit tool)";

export type FetchResult = {
  ok: boolean;
  status: number | null;
  text: string;
  headers: Headers | null;
  elapsedMs: number;
  error: string | null;
};

/** GET a URL with a timeout and a declared bot user-agent. Never throws --
 * network failures, timeouts and non-2xx responses all come back as a
 * regular FetchResult so the diagnosis run can turn them into findings. */
export async function fetchText(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      text,
      headers: res.headers,
      elapsedMs: Date.now() - start,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      text: "",
      headers: null,
      elapsedMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Errore di rete sconosciuto",
    };
  } finally {
    clearTimeout(timeout);
  }
}
