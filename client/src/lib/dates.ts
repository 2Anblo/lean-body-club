export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** 0 = Monday … 6 = Sunday */
export function dayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Monday 00:00 (local time) of the week that contains `d`. */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - dayIndex(x));
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Just now", "5m ago", "2h ago", "Yesterday", "Mon", "Nov 3" */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso);
  const seconds = (now.getTime() - t.getTime()) / 1000;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (isSameDay(t, now)) return `${Math.floor(seconds / 3600)}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(t, yesterday)) return 'Yesterday';
  if (seconds < 6 * 86400) return DAY_SHORT[dayIndex(t)];
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Sunday, November 16" */
export function longDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "Nov 10 – Nov 16" */
export function weekRangeLabel(weekStartIso: string): string {
  const start = new Date(weekStartIso);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${f(start)} – ${f(end)}`;
}

/** "19:00" -> "7:00 PM" */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "Nov 2026" */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
