// ---------- API access (server-side only; the key never reaches the browser) ----------
export async function api(path) {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: { Authorization: `Bearer ${process.env.DASHBOARD_API_KEY}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DASHBOARD_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---------- Formatting ----------
const TZ = 'Africa/Cairo';
export const n = v => Number(v || 0);
export const fmtNum = v => n(v).toLocaleString('en-US');
export const fmtTok = v => {
  const x = n(v);
  if (x >= 1e9) return (x / 1e9).toFixed(2) + 'B';
  if (x >= 1e6) return (x / 1e6).toFixed(2) + 'M';
  if (x >= 1e3) return (x / 1e3).toFixed(1) + 'K';
  return String(Math.round(x));
};
export const fmtCost = v => {
  const x = n(v);
  return '$' + (x >= 1000 ? x.toLocaleString('en-US', { maximumFractionDigits: 0 }) : x.toFixed(2));
};
const toDate = s => new Date(String(s).replace(' ', 'T') + (String(s).endsWith('Z') ? '' : 'Z'));
export const fmtDate = s => {
  if (!s) return '—';
  return toDate(s).toLocaleString('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};
export const fmtTime = s => (s ? toDate(s).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : '');
export const fmtDayLabel = day => {
  const d = new Date(day + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};
export const fmtAgo = s => {
  if (!s) return '—';
  const sec = Math.max(0, (Date.now() - toDate(s).getTime()) / 1000);
  if (sec < 60) return 'الآن';
  if (sec < 3600) return `منذ ${Math.floor(sec / 60)} د`;
  if (sec < 86400) return `منذ ${Math.floor(sec / 3600)} س`;
  if (sec < 86400 * 30) return `منذ ${Math.floor(sec / 86400)} يوم`;
  return fmtDate(s);
};
export const qs = obj => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};
export const initials = s => {
  const parts = String(s || '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
};

// ---------- Organization colors (validated categorical palette; color follows the org id, never its rank) ----------
export const orgSlot = id => ((Number(id) || 1) - 1) % 5 + 1;

// ---------- Scope: the org + time range every page is filtered by ----------
export function scopeOf(params) {
  return { org: params?.org && params.org !== 'all' ? String(params.org) : '', days: params?.days || '30' };
}
export const href = (path, scope, extra = {}) => path + qs({ org: scope.org, days: scope.days === '30' ? '' : scope.days, ...extra });

// ---------- Prompt context (IDE extensions prepend editor selection / opened file / reminders) ----------
const CTX_TAGS = ['ide_selection', 'ide_opened_file', 'ide_diagnostics', 'system-reminder'];
const CTX_RE = new RegExp(`<(${CTX_TAGS.join('|')})>([\\s\\S]*?)(?:</\\1>|$)`, 'g');
export const splitPrompt = (raw = '') => {
  const ctx = [];
  const text = String(raw ?? '').replace(CTX_RE, (_, tag, body) => {
    const file = body.match(/(?:from|file)\s+(\S.*?\.\w+)(?::|\s|$)/i)?.[1];
    const lines = body.match(/lines? (\d+(?: to \d+)?)/i)?.[1];
    ctx.push({ tag, body: body.trim(), label: file ? `${file.split(/[\\/]/).pop()}${lines ? ` (${lines.replace(' to ', '–')})` : ''}` : tag });
    return '';
  }).trim();
  return { text, ctx };
};
export const cleanTitle = t => (t ? splitPrompt(t).text.replace(/\s+/g, ' ').trim() : '');

export const ENTRY = { cli: 'Terminal', 'claude-vscode': 'VS Code', 'non-interactive': 'VS Code / IDE', 'sdk-ts': 'SDK', 'sdk-py': 'SDK' };
