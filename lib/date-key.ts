/** 로컬 타임존 기준 YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function addDaysToKey(key: string, delta: number): string {
  const dt = parseDateKey(key);
  if (!dt) return key;
  dt.setDate(dt.getDate() + delta);
  return toDateKey(dt);
}

export function isValidDateKey(key: string): boolean {
  return parseDateKey(key) !== null;
}
