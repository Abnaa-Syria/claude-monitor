import { api, n, qs, cleanTitle } from '../../lib/api';

export const dynamic = 'force-dynamic';

const esc = v => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header, rows) => '﻿' + [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n');

// CSV export of the current view (developers / projects / sessions), opened directly by Excel (UTF-8 BOM).
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const base = { days: p.get('days') || '30', org: p.get('org') || '' };
  const type = p.get('type');
  let body;
  if (type === 'developers' || type === 'projects') {
    const ov = await api(`/api/overview${qs(base)}`);
    body = type === 'developers'
      ? csv(['developer', 'email', 'organizations', 'sessions', 'projects', 'prompts', 'input_tokens', 'output_tokens', 'cache_tokens', 'cost_usd', 'last_activity_utc'],
          ov.users.map(u => [u.user_name, u.user_email, u.orgs, u.sessions, u.projects, u.prompts, u.input_tokens, u.output_tokens, n(u.cache_read_tokens) + n(u.cache_creation_tokens), n(u.cost_usd).toFixed(4), u.last_activity]))
      : csv(['project', 'developers', 'organizations', 'sessions', 'input_tokens', 'output_tokens', 'cost_usd', 'last_activity_utc'],
          ov.projects.map(r => [r.k, r.user_list, r.orgs, r.sessions, r.input_tokens, r.output_tokens, n(r.cost_usd).toFixed(4), r.last_activity]));
  } else {
    const { sessions } = await api(`/api/sessions${qs({ ...base, user: p.get('user'), project: p.get('project'), q: p.get('q') })}`);
    body = csv(['session_id', 'title', 'developer', 'email', 'organization', 'project', 'branch', 'entrypoint', 'prompts', 'input_tokens', 'output_tokens', 'cost_usd', 'started_utc', 'last_activity_utc'],
      sessions.map(s => [s.session_id, cleanTitle(s.title), s.user_name, s.user_email, s.org_name, s.project_name, s.git_branch, s.entrypoint, s.prompts, s.input_tokens, s.output_tokens, n(s.cost_usd).toFixed(4), s.started_at, s.last_activity]));
  }
  const name = `claude-${type || 'sessions'}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` } });
}
