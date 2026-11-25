export async function api(path) {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: { Authorization: `Bearer ${process.env.DASHBOARD_API_KEY}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const TZ = 'Africa/Cairo';
export const n = v => Number(v || 0);
export const fmtNum = v => n(v).toLocaleString('en-US');
export const fmtTok = v => {
  const x = n(v);
  if (x >= 1e6) return (x / 1e6).toFixed(2) + 'M';
  if (x >= 1e3) return (x / 1e3).toFixed(1) + 'K';
  return String(x);
};
export const fmtCost = v => '$' + n(v).toFixed(2);
export const fmtDate = s => {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};
export const qs = obj => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};
