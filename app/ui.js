import Link from 'next/link';
import { logout } from './actions';
import { ThemeToggle, DailyChart } from './client';
import { IconHome, IconUsers, IconFolder, IconChat, IconGear, IconLogout, IconInbox } from './icons';
import { api, n, fmtNum, fmtTok, fmtCost, fmtAgo, fmtDate, fmtDayLabel, href, qs, initials, orgSlot, cleanTitle, isDevice, ENTRY } from '../lib/api';

const NAV = [
  ['overview', '/', 'نظرة عامة', IconHome],
  ['developers', '/developers', 'المطوّرون', IconUsers],
  ['projects', '/projects', 'المشاريع', IconFolder],
  ['sessions', '/sessions', 'الجلسات', IconChat],
];

const RANGES = [['1', 'اليوم'], ['7', '7 أيام'], ['30', '30 يوم'], ['90', '90 يوم'], ['3650', 'الكل']];

// ---------- Page frame: sidebar + sticky scope bar (org switcher + time range) ----------
export async function Shell({ active, scope, path, extra = {}, showScope = true, children }) {
  const meta = await api('/api/meta');
  const orgs = meta?.orgs || [];
  return (
    <div className="app">
      <aside className="side">
        <Link href={href('/', scope)} className="brand">
          <span className="brand-mark"><img src="/qt.png" alt="" /></span>
          <span><div className="brand-name">Claude Monitor</div><div className="brand-sub">قيمة تك · متابعة الفريق</div></span>
        </Link>
        <nav className="nav">
          <div className="nav-label">القائمة</div>
          {NAV.map(([key, p, label, Icon]) => (
            <Link key={key} href={href(p, scope)} className={active === key ? 'on' : ''}><Icon /><span>{label}</span></Link>
          ))}
          <Link href="/settings" className={active === 'settings' ? 'on' : ''}><IconGear /><span>الإعدادات</span></Link>
        </nav>
        <div className="side-foot">
          <ThemeToggle />
          <form action={logout}><button className="side-btn" type="submit"><IconLogout /><span>تسجيل الخروج</span></button></form>
        </div>
      </aside>
      <div className="main">
        {showScope && (
          <div className="topbar">
            <div className="topbar-inner">
              <div className="seg" aria-label="المنظمة">
                <Link className={!scope.org ? 'on' : ''} href={path + qs({ ...extra, days: scope.days === '30' ? '' : scope.days })}>كل المنظمات</Link>
                {orgs.map(o => (
                  <Link key={o.id} className={scope.org === String(o.id) ? 'on' : ''}
                    href={path + qs({ ...extra, org: String(o.id), days: scope.days === '30' ? '' : scope.days })}>
                    <i className={`dot org-${orgSlot(o.id)}`} />{o.name}
                  </Link>
                ))}
              </div>
              <div className="scope">
                <div className="seg" aria-label="الفترة">
                  {RANGES.map(([d, label]) => (
                    <Link key={d} className={scope.days === d ? 'on' : ''} href={path + qs({ ...extra, org: scope.org, days: d === '30' ? '' : d })}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({ crumbs, title, sub, actions }) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1 dir="auto">{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </div>
  );
}

export function Card({ title, hint, actions, children, pad = true, style }) {
  return (
    <section className="card" style={style}>
      {(title || actions) && (
        <div className="card-head">
          <div><h2>{title}</h2>{hint && <div className="hint">{hint}</div>}</div>
          {actions}
        </div>
      )}
      {pad ? <div className="card-body">{children}</div> : <div style={{ paddingTop: title ? 14 : 0 }}>{children}</div>}
    </section>
  );
}

export function Kpi({ label, value, note, icon: Icon, hero }) {
  return (
    <div className={`card kpi${hero ? ' hero' : ''}`}>
      <div className="k">{Icon && <Icon />}{label}</div>
      <div className="v num">{value}</div>
      {note && <div className="d">{note}</div>}
    </div>
  );
}

export function Empty({ children = 'لا توجد بيانات في هذه الفترة' }) {
  return <div className="empty"><IconInbox /><div>{children}</div></div>;
}

export const OrgTag = ({ id, name }) => name ? <span className="pill"><i className={`dot org-${orgSlot(id)}`} />{name}</span> : null;

export function Who({ user, name, email, scope, sub }) {
  const label = name || user;
  const device = isDevice(user) && (!name || name === user);
  return (
    <Link className="who" href={href('/developer', scope, { user })}>
      <span className={`avatar${device ? ' unknown' : ''}`}>{device ? '?' : initials(label)}</span>
      <span style={{ minWidth: 0 }}>
        <div className="who-name ltr" dir="auto">{label}</div>
        {device ? <div className="who-sub">حساب غير معروف بعد · جهاز</div>
          : (sub || (name && name !== user && (email || user))) && <div className="who-sub ltr">{sub || email || user}</div>}
      </span>
    </Link>
  );
}

// "a, b, c, d, e" → "a، b، c +2"
export function NameList({ list, max = 3 }) {
  const names = String(list || '').split(', ').filter(Boolean);
  if (!names.length) return <span className="faint">—</span>;
  return <span dir="auto">{names.slice(0, max).join('، ')}{names.length > max && <span className="pill" style={{ marginInlineStart: 6 }}>+{names.length - max}</span>}</span>;
}

export const ProjectTag = ({ name, scope }) => name && name !== '(unknown)'
  ? <Link className="pill proj ltr" href={href('/project', scope, { name })}>{name}</Link>
  : <span className="faint">—</span>;

const sessionTitle = s => cleanTitle(s.title)
  || <span className="faint">{s.project_name ? `جلسة على ${s.project_name}` : 'جلسة بدون رسائل مكتوبة'}</span>;

// ---------- Shared tables ----------
export function DevelopersTable({ rows, scope, max }) {
  if (!rows.length) return <Empty />;
  const top = max ?? Math.max(...rows.map(r => n(r.cost_usd)), 0.0001);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>المطوّر</th><th>المنظمة</th><th className="n">الجلسات</th><th className="n">المشاريع</th><th className="n">الرسائل</th>
          <th className="n">Tokens</th><th className="n">التكلفة</th><th>آخر نشاط</th>
        </tr></thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.k}>
              <td><Who user={u.k} name={u.user_name} email={u.user_email} scope={scope} /></td>
              <td className="muted">{u.orgs || '—'}</td>
              <td className="n num">{fmtNum(u.sessions)}</td>
              <td className="n num">{fmtNum(u.projects)}</td>
              <td className="n num">{fmtNum(u.prompts)}</td>
              <td className="n num">{fmtTok(n(u.input_tokens) + n(u.output_tokens))}</td>
              <td className="n"><div className="bar-cell"><Cost row={u} /><span className="minibar"><i style={{ width: `${(n(u.cost_usd) / top) * 100}%` }} /></span></div></td>
              <td className="faint">{fmtAgo(u.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectsTable({ rows, scope, compact }) {
  if (!rows.length) return <Empty />;
  const top = Math.max(...rows.map(r => n(r.cost_usd)), 0.0001);
  if (compact) return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>المشروع</th><th className="n">المطوّرون</th><th className="n">التكلفة</th><th>آخر نشاط</th></tr></thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.k}>
              <td><ProjectTag name={p.k} scope={scope} /></td>
              <td className="n num">{fmtNum(p.users)}</td>
              <td className="n num"><Cost row={p} /></td>
              <td className="faint">{fmtAgo(p.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>المشروع</th><th>المطوّرون</th><th>المنظمة</th><th className="n">الجلسات</th><th className="n">Tokens</th><th className="n">التكلفة</th><th>آخر نشاط</th>
        </tr></thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.k}>
              <td><ProjectTag name={p.k} scope={scope} /></td>
              <td className="wrap muted" style={{ minWidth: 180 }}><NameList list={p.user_list} /></td>
              <td className="muted">{p.orgs || '—'}</td>
              <td className="n num">{fmtNum(p.sessions)}</td>
              <td className="n num">{fmtTok(n(p.input_tokens) + n(p.output_tokens))}</td>
              <td className="n"><div className="bar-cell"><Cost row={p} /><span className="minibar"><i style={{ width: `${(n(p.cost_usd) / top) * 100}%` }} /></span></div></td>
              <td className="faint">{fmtAgo(p.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SessionsTable({ rows, scope, hideUser, hideProject, compact }) {
  if (!rows.length) return <Empty>لا توجد جلسات</Empty>;
  if (compact) return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>المحادثة</th><th className="n">التكلفة</th><th>آخر نشاط</th></tr></thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.session_id}>
              <td className="wrap" style={{ minWidth: 200 }}>
                <Link href={`/sessions/${s.session_id}`} className="title-cell">
                  <span className="row-link clamp" dir="auto">{sessionTitle(s)}</span>
                  <small><span className="ltr">{s.user_name}</span>{s.project_name ? <> · <span className="ltr">{s.project_name}</span></> : null}</small>
                </Link>
              </td>
              <td className="n num"><Cost row={s} /></td>
              <td className="faint">{fmtAgo(s.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>المحادثة</th>{!hideUser && <th>المطوّر</th>}{!hideProject && <th>المشروع</th>}<th>المنظمة</th>
          <th className="n">الرسائل</th><th className="n">Tokens</th><th className="n">التكلفة</th><th>آخر نشاط</th>
        </tr></thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.session_id}>
              <td className="wrap">
                <Link href={`/sessions/${s.session_id}`} className="title-cell">
                  <span className="row-link clamp" dir="auto">{sessionTitle(s)}</span>
                  <small>{ENTRY[s.entrypoint] || s.entrypoint || '—'} · بدأت {fmtDate(s.started_at)}</small>
                </Link>
              </td>
              {!hideUser && <td><Who user={s.user} name={s.user_name} scope={scope} /></td>}
              {!hideProject && <td><ProjectTag name={s.project_name} scope={scope} /></td>}
              <td><OrgTag id={s.org_id} name={s.org_name} /></td>
              <td className="n num">{fmtNum(s.prompts)}</td>
              <td className="n num">{fmtTok(n(s.input_tokens) + n(s.output_tokens))}</td>
              <td className="n num"><Cost row={s} /></td>
              <td className="faint">{fmtAgo(s.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ModelsList({ rows }) {
  if (!rows?.length) return <Empty>لا توجد طلبات</Empty>;
  const top = Math.max(...rows.map(r => n(r.cost_usd)), 0.0001);
  return (
    <div className="barlist">
      {rows.map(m => (
        <div className="item" key={m.model || 'x'}>
          <span className="label ltr">{m.model || 'غير معروف'}</span>
          <span className="val num">{fmtCost(m.cost_usd)}</span>
          <span className="track"><i style={{ width: `${Math.max(2, (n(m.cost_usd) / top) * 100)}%` }} /></span>
          <span className="meta"><span className="num">{fmtNum(m.requests)}</span> طلب · <span className="num">{fmtTok(n(m.input_tokens) + n(m.output_tokens))}</span> Tokens</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Daily chart data: fill empty days, one series per org (or a single series) ----------
export function Daily({ daily, scope, orgs, height }) {
  // Days are 'YYYY-MM-DD' in Cairo time. "All" starts at the first day with data; otherwise the last N days.
  const DAY = 86400000;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const todayMs = Date.parse(today + 'T00:00:00Z');
  const span = Number(scope.days) || 30;
  const firstKnown = daily.map(d => d.day).sort()[0];
  let fromMs = todayMs - (Math.min(span, 365) - 1) * DAY;
  if (span > 365 && firstKnown) fromMs = Math.min(Date.parse(firstKnown + 'T00:00:00Z'), todayMs);
  const days = [];
  for (let t = fromMs; t <= todayMs; t += DAY) {
    const key = new Date(t).toISOString().slice(0, 10);
    days.push({ day: key, label: fmtDayLabel(key), values: {} });
  }
  const idx = Object.fromEntries(days.map((d, i) => [d.day, i]));
  const multi = !scope.org && orgs.length > 1;
  for (const r of daily) {
    const i = idx[r.day]; if (i == null) continue;
    const k = multi ? String(r.org_id) : 'all';
    const v = days[i].values[k] ||= { cost: 0, tokens: 0, sessions: 0 };
    v.cost += n(r.cost_usd); v.tokens += n(r.tokens); v.sessions += n(r.sessions);
  }
  const withData = new Set(daily.map(r => String(r.org_id)));
  const series = multi
    ? orgs.filter(o => withData.has(String(o.id))).map(o => ({ key: String(o.id), label: o.name, slot: orgSlot(o.id) }))
    : [{ key: 'all', label: 'الكل', slot: scope.org ? orgSlot(scope.org) : 1 }];
  if (!daily.length) return <Empty>لا يوجد استهلاك في هذه الفترة</Empty>;
  return <DailyChart days={days} series={series} height={height} />;
}

// Cost of a row. No model requests at all means the cost data never reached us (telemetry not active
// on that machine yet), which is different from a real $0.
export function Cost({ row }) {
  if (!n(row.requests)) return <span className="faint" title="لم تصل بيانات التكلفة من هذا الجهاز بعد">—</span>;
  return <b className="num">{fmtCost(row.cost_usd)}</b>;
}
