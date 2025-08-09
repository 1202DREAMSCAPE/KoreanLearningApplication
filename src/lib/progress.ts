const KEY = 'krsrs-progress-v1';

type Payload = { date: string; count: number };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function read(): Payload {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const p = JSON.parse(raw) as Payload;
    if (p.date !== todayStr()) return { date: todayStr(), count: 0 };
    return p;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

function write(p: Payload) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getTodayCount(): number {
  return read().count;
}
export function incReviews(n = 1) {
  const p = read();
  p.count += n;
  write(p);
}
export function resetToday() {
  write({ date: todayStr(), count: 0 });
}
