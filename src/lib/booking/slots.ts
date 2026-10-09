// Fasce prenotabili per le chiamate conoscitive con i titolari: Lun-Ven
// 18:30-20:00 ora italiana, slot da 20 minuti. Tutto è calcolato in
// Europe/Rome indipendentemente dal fuso del server (Vercel gira in UTC).

export const TIME_ZONE = "Europe/Rome";
export const SLOT_MINUTES = 20;
const SLOT_STARTS = ["18:30", "18:50", "19:10", "19:30"];
const WORKDAYS = new Set([1, 2, 3, 4, 5]); // lun-ven
const DAYS_AHEAD = 14;
const MIN_NOTICE_MS = 3 * 60 * 60 * 1000; // niente slot entro 3 ore da adesso

export type Slot = { start: string; end: string };
export type BusyInterval = { start: string; end: string };
export type SlotDay = { label: string; slots: (Slot & { time: string })[] };

/** Offset (ms) di Europe/Rome rispetto a UTC nell'istante dato. */
function romeOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - at.getTime();
}

/** Converte un orario "da muro" di Roma in un istante UTC (gestisce l'ora legale). */
function romeWallTimeToDate(y: number, m: number, d: number, hh: number, mm: number): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - romeOffsetMs(new Date(guess));
  return new Date(guess - romeOffsetMs(new Date(first)));
}

/** Data di oggi a Roma come [anno, mese, giorno]. */
function romeToday(now: Date): [number, number, number] {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now).split("-").map(Number);
  return [y, m, d];
}

export function generateSlots(now: Date = new Date()): Slot[] {
  const [y, m, d] = romeToday(now);
  const slots: Slot[] = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    // Mezzogiorno UTC del giorno i: sicuro per ricavare giorno della settimana e data.
    const day = new Date(Date.UTC(y, m - 1, d + i, 12));
    if (!WORKDAYS.has(day.getUTCDay())) continue;
    for (const hhmm of SLOT_STARTS) {
      const [hh, mm] = hhmm.split(":").map(Number);
      const start = romeWallTimeToDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hh, mm);
      if (start.getTime() - now.getTime() < MIN_NOTICE_MS) continue;
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }
  return slots;
}

export function removeBusy(slots: Slot[], busy: BusyInterval[]): Slot[] {
  const intervals = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)] as const);
  return slots.filter((s) => {
    const a = Date.parse(s.start);
    const b = Date.parse(s.end);
    return !intervals.some(([bs, be]) => a < be && bs < b);
  });
}

export function isOfferedSlot(start: string, now: Date = new Date()): Slot | null {
  return generateSlots(now).find((s) => s.start === start) ?? null;
}

export function formatSlotLabel(startIso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startIso));
}

export function groupByDay(slots: Slot[]): SlotDay[] {
  const dayFmt = new Intl.DateTimeFormat("it-IT", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
  const timeFmt = new Intl.DateTimeFormat("it-IT", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  const days: SlotDay[] = [];
  for (const s of slots) {
    const label = dayFmt.format(new Date(s.start));
    let day = days.find((x) => x.label === label);
    if (!day) {
      day = { label, slots: [] };
      days.push(day);
    }
    day.slots.push({ ...s, time: timeFmt.format(new Date(s.start)) });
  }
  return days;
}
