import Link from 'next/link';
import { api, qs, scopeOf, fmtNum } from '../../lib/api';
import { Shell, PageHead, Card, SessionsTable } from '../ui';
import { IconSearch, IconDownload } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Sessions({ searchParams }) {
  const params = await searchParams;
  const scope = scopeOf(params);
  const f = { user: params.user || '', project: params.project || '', q: params.q || '' };
  const { sessions } = await api(`/api/sessions${qs({ days: scope.days, org: scope.org, ...f })}`);
  const keep = { org: scope.org, days: scope.days === '30' ? '' : scope.days };
  const without = k => `/sessions${qs({ ...keep, ...f, [k]: '' })}`;

  return (
    <Shell active="sessions" scope={scope} path="/sessions" extra={f}>
      <PageHead title="الجلسات" sub={sessions.length >= 500 ? 'أحدث 500 جلسة' : `${fmtNum(sessions.length)} جلسة`}
        actions={<a className="btn" href={`/export${qs({ type: 'sessions', days: scope.days, org: scope.org, ...f })}`}><IconDownload />تصدير CSV</a>} />

      <form className="toolbar" action="/sessions">
        {Object.entries({ ...keep, user: f.user, project: f.project }).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        <label className="search"><IconSearch /><input className="input" type="search" name="q" defaultValue={f.q} placeholder="ابحث داخل رسائل المطوّرين…" /></label>
        <button className="btn primary" type="submit">بحث</button>
        {f.user && <Link className="chip" href={without('user')}><span className="ltr">{f.user}</span> ✕</Link>}
        {f.project && <Link className="chip" href={without('project')}><span className="ltr">{f.project}</span> ✕</Link>}
        {f.q && <Link className="chip" href={without('q')}>&quot;{f.q}&quot; ✕</Link>}
      </form>

      <Card pad={false}>
        <SessionsTable rows={sessions} scope={scope} />
      </Card>
    </Shell>
  );
}
