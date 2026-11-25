import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, n, fmtNum, fmtTok, fmtCost, fmtDate, qs, splitPrompt, cleanTitle } from '../../../lib/api';
import { Shell } from '../../ui';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }) {
  const { id } = await params;
  const data = await api(`/api/sessions/${encodeURIComponent(id)}`);
  if (!data) notFound();
  const { session: s, prompts, models, tools } = data;

  return (
    <Shell>
      <div className="head">
        <div style={{ minWidth: 0 }}>
          <div className="sub"><Link href="/sessions">← السيشنز</Link></div>
          <h1 dir="auto" style={{ wordBreak: 'break-word' }}>{cleanTitle(s.title) || 'سيشن من غير عنوان'}</h1>
        </div>
      </div>

      <section className="card meta">
        <div><div className="k">الديفلوبر</div><Link className="ltr" href={`/sessions${qs({ user: s.user })}`}>{s.user}</Link></div>
        <div><div className="k">المشروع</div><span className="ltr">{s.project_name || '—'}</span></div>
        <div><div className="k">المسار</div><span className="ltr muted" style={{ wordBreak: 'break-all' }}>{s.project_dir || '—'}</span></div>
        <div><div className="k">البداية / آخر نشاط</div><span className="ltr">{fmtDate(s.started_at)} → {fmtDate(s.last_activity)}</span></div>
        <div><div className="k">التكلفة</div><b className="ltr">{fmtCost(s.cost_usd)}</b></div>
        <div><div className="k">Tokens (in / out / cache)</div><span className="ltr">{fmtTok(s.input_tokens)} / {fmtTok(s.output_tokens)} / {fmtTok(n(s.cache_read_tokens) + n(s.cache_creation_tokens))}</span></div>
        <div><div className="k">الجهاز</div><span className="ltr">{[s.os_user, s.host].filter(Boolean).join(' @ ') || '—'}</span></div>
        <div><div className="k">Session ID</div><span className="ltr muted">{s.session_id}</span></div>
      </section>

      {models.length > 0 && (
        <section className="card">
          <h2>الموديلات</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Model</th><th className="num">Requests</th><th className="num">Input</th><th className="num">Output</th><th className="num">Cache</th><th className="num">التكلفة</th></tr></thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.model || 'x'}>
                    <td className="ltr">{m.model || '—'}</td>
                    <td className="num">{fmtNum(m.requests)}</td>
                    <td className="num">{fmtTok(m.input_tokens)}</td>
                    <td className="num">{fmtTok(m.output_tokens)}</td>
                    <td className="num">{fmtTok(n(m.cache_read_tokens) + n(m.cache_creation_tokens))}</td>
                    <td className="num">{fmtCost(m.cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section className="card">
          <h2>الأدوات اللي Claude استخدمها</h2>
          <div className="filters" style={{ margin: 0 }}>
            {tools.map(t => <span key={t.tool || 'x'} className="pill ltr">{t.tool || '?'} × {t.n}</span>)}
          </div>
        </section>
      )}

      <section className="card">
        <h2>البرومبتس ({prompts.length})</h2>
        {prompts.length === 0 && <div className="empty">مفيش برومبتس متسجلة</div>}
        {prompts.map((pr, i) => {
          const { text, ctx } = splitPrompt(pr.prompt);
          return (
            <div className="prompt" key={i}>
              <div className="when ltr">#{i + 1} · {fmtDate(pr.ts)}</div>
              {ctx.map((c, j) => (
                <details className="ctx" key={j}>
                  <summary className="ltr">📎 {c.label}</summary>
                  <pre dir="auto">{c.body}</pre>
                </details>
              ))}
              {text ? <pre dir="auto">{text}</pre> : <span className="muted">(سياق بس، من غير نص)</span>}
            </div>
          );
        })}
      </section>
    </Shell>
  );
}
