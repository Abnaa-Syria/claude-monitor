import Link from 'next/link';
import { api, n, fmtNum, fmtTok, fmtCost, fmtDate, qs } from '../lib/api';
import { Shell, RangePicker } from './ui';

export const dynamic = 'force-dynamic';

export default async function Overview({ searchParams }) {
  const params = await searchParams;
  const days = params.days || '30';
  const { users, projects } = await api(`/api/overview${qs({ days })}`);

  const sum = k => users.reduce((a, u) => a + n(u[k]), 0);
  const totalTokens = sum('input_tokens') + sum('output_tokens');

  return (
    <Shell>
      <div className="head">
        <div>
          <h1>نظرة عامة</h1>
          <div className="sub">استخدام Claude Code لكل ديفلوبر ولكل مشروع</div>
        </div>
        <RangePicker base="/" params={{ days }} />
      </div>

      <div className="stats">
        <div className="stat"><div className="k">التكلفة</div><div className="v ltr">{fmtCost(sum('cost_usd'))}</div></div>
        <div className="stat"><div className="k">Tokens (input + output)</div><div className="v ltr">{fmtTok(totalTokens)}</div></div>
        <div className="stat"><div className="k">Cache tokens</div><div className="v ltr">{fmtTok(sum('cache_read_tokens') + sum('cache_creation_tokens'))}</div></div>
        <div className="stat"><div className="k">السيشنز</div><div className="v">{fmtNum(sum('sessions'))}</div></div>
        <div className="stat"><div className="k">البرومبتس</div><div className="v">{fmtNum(sum('prompts'))}</div></div>
        <div className="stat"><div className="k">ديفلوبرز نشطين</div><div className="v">{users.length}</div></div>
      </div>

      <section className="card">
        <h2>الديفلوبرز</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>الديفلوبر</th><th className="num">سيشنز</th><th className="num">مشاريع</th><th className="num">برومبتس</th>
                <th className="num">Input</th><th className="num">Output</th><th className="num">Cache</th><th className="num">التكلفة</th><th>آخر نشاط</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={9} className="empty">مفيش نشاط في الفترة دي</td></tr>}
              {users.map(u => (
                <tr key={u.user}>
                  <td><Link className="ltr" href={`/sessions${qs({ user: u.user, days })}`}>{u.user}</Link></td>
                  <td className="num">{fmtNum(u.sessions)}</td>
                  <td className="num">{fmtNum(u.projects)}</td>
                  <td className="num">{fmtNum(u.prompts)}</td>
                  <td className="num">{fmtTok(u.input_tokens)}</td>
                  <td className="num">{fmtTok(u.output_tokens)}</td>
                  <td className="num">{fmtTok(n(u.cache_read_tokens) + n(u.cache_creation_tokens))}</td>
                  <td className="num"><b>{fmtCost(u.cost_usd)}</b></td>
                  <td className="muted ltr">{fmtDate(u.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>المشاريع</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>المشروع</th><th>الديفلوبرز</th><th className="num">سيشنز</th><th className="num">Tokens</th><th className="num">التكلفة</th><th>آخر نشاط</th></tr>
            </thead>
            <tbody>
              {projects.length === 0 && <tr><td colSpan={6} className="empty">مفيش مشاريع في الفترة دي</td></tr>}
              {projects.map(p => (
                <tr key={p.project}>
                  <td><Link className="ltr" href={`/sessions${qs({ project: p.project, days })}`}><b>{p.project}</b></Link></td>
                  <td className="title muted ltr">{p.user_list}</td>
                  <td className="num">{fmtNum(p.sessions)}</td>
                  <td className="num">{fmtTok(p.tokens)}</td>
                  <td className="num">{fmtCost(p.cost_usd)}</td>
                  <td className="muted ltr">{fmtDate(p.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
