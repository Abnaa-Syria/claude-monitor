import Link from 'next/link';
import { api, n, fmtNum, fmtTok, fmtCost, fmtDate, qs, cleanTitle } from '../../lib/api';
import { Shell, RangePicker } from '../ui';

export const dynamic = 'force-dynamic';

const ENTRY = { cli: 'Terminal', 'claude-vscode': 'VS Code / Cursor', 'sdk-ts': 'SDK', 'sdk-py': 'SDK', 'non-interactive': 'VS Code / SDK' };

export default async function Sessions({ searchParams }) {
  const params = await searchParams;
  const p = { days: params.days || '30', user: params.user || '', project: params.project || '', q: params.q || '' };
  const { sessions } = await api(`/api/sessions${qs(p)}`);

  return (
    <Shell>
      <div className="head">
        <div>
          <h1>السيشنز</h1>
          <div className="sub">{sessions.length >= 500 ? 'أحدث 500 سيشن' : `${sessions.length} سيشن`}</div>
        </div>
        <RangePicker base="/sessions" params={p} />
      </div>

      <form className="filters" action="/sessions">
        <input type="hidden" name="days" value={p.days} />
        {p.user && <input type="hidden" name="user" value={p.user} />}
        {p.project && <input type="hidden" name="project" value={p.project} />}
        <input type="text" name="q" defaultValue={p.q} placeholder="ابحث في البرومبتس..." />
        <button className="btn" type="submit">بحث</button>
        {p.user && <Link className="chip" href={`/sessions${qs({ ...p, user: '' })}`}><span className="ltr">{p.user}</span> ✕</Link>}
        {p.project && <Link className="chip" href={`/sessions${qs({ ...p, project: '' })}`}><span className="ltr">{p.project}</span> ✕</Link>}
        {p.q && <Link className="chip" href={`/sessions${qs({ ...p, q: '' })}`}>&quot;{p.q}&quot; ✕</Link>}
      </form>

      <section className="card">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>العنوان (أول برومبت)</th><th>الديفلوبر</th><th>المشروع</th><th>من</th><th>البداية</th>
                <th className="num">برومبتس</th><th className="num">Tokens</th><th className="num">التكلفة</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && <tr><td colSpan={8} className="empty">مفيش سيشنز</td></tr>}
              {sessions.map(s => (
                <tr key={s.session_id}>
                  <td className="title">
                    <Link href={`/sessions/${s.session_id}`} dir="auto">{cleanTitle(s.title) || <span className="muted">(من غير عنوان)</span>}</Link>
                  </td>
                  <td><Link className="ltr" href={`/sessions${qs({ ...p, user: s.user })}`}>{s.user}</Link></td>
                  <td>{s.project_name ? <Link className="pill accent ltr" href={`/sessions${qs({ ...p, project: s.project_name })}`}>{s.project_name}</Link> : <span className="muted">—</span>}</td>
                  <td><span className="pill">{ENTRY[s.entrypoint] || s.entrypoint || '—'}</span></td>
                  <td className="muted ltr">{fmtDate(s.started_at)}</td>
                  <td className="num">{fmtNum(s.prompts)}</td>
                  <td className="num">{fmtTok(n(s.input_tokens) + n(s.output_tokens))}</td>
                  <td className="num">{fmtCost(s.cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
