import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, n, qs, href, scopeOf, fmtNum, fmtTok, fmtCost, fmtAgo, initials } from '../../lib/api';
import { Shell, PageHead, Card, Kpi, Daily, SessionsTable, ProjectsTable, ModelsList } from '../ui';
import { IconDollar, IconBolt, IconChat, IconFolder, IconGear } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Developer({ searchParams }) {
  const params = await searchParams;
  const scope = scopeOf(params);
  const user = params.user;
  if (!user) notFound();
  const [d, meta] = await Promise.all([api(`/api/developer${qs({ user, days: scope.days, org: scope.org })}`), api('/api/meta')]);
  const info = d?.users?.[0];
  const name = info?.user_name || user;
  const t = d?.totals;

  return (
    <Shell active="developers" scope={scope} path="/developer" extra={{ user }}>
      <div className="page-head">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 0 }}>
          <span className="avatar lg">{initials(name)}</span>
          <div style={{ minWidth: 0 }}>
            <div className="crumbs"><Link href={href('/developers', scope)}>المطوّرون</Link><span>/</span></div>
            <h1 className="ltr" dir="auto">{name}</h1>
            <div className="sub ltr" dir="auto">{info?.user_email && info.user_email !== name ? info.user_email : user}{info?.orgs ? ` · ${info.orgs}` : ''}</div>
          </div>
        </div>
        {info?.user_email && <Link className="btn" href="/settings#people"><IconGear />تعديل الاسم</Link>}
      </div>

      {!d ? <Card><div className="empty">لا يوجد نشاط لهذا المطوّر في الفترة المحددة</div></Card> : (
        <>
          <div className="kpis">
            <Kpi hero icon={IconDollar} label="التكلفة" value={fmtCost(t.cost_usd)} note={`${fmtNum(t.requests)} طلب`} />
            <Kpi icon={IconBolt} label="Tokens" value={fmtTok(n(t.input_tokens) + n(t.output_tokens))} note={`Cache: ${fmtTok(n(t.cache_read_tokens) + n(t.cache_creation_tokens))}`} />
            <Kpi icon={IconChat} label="الجلسات" value={fmtNum(t.sessions)} note={<><span className="num">{fmtNum(t.prompts)}</span> رسالة</>} />
            <Kpi icon={IconFolder} label="المشاريع" value={fmtNum(t.projects)} note={`آخر نشاط ${fmtAgo(info?.last_activity)}`} />
          </div>
          <div className="grid g-2">
            <Card title="الاستهلاك اليومي"><Daily daily={d.daily} scope={scope} orgs={meta.orgs} height={200} /></Card>
            <Card title="الموديلات"><ModelsList rows={d.models} /></Card>
          </div>
          <Card title="المشاريع" pad={false}><ProjectsTable rows={d.projects} scope={scope} /></Card>
          <Card title="الجلسات" hint={`${fmtNum(d.sessions.length)} جلسة`} pad={false}>
            <SessionsTable rows={d.sessions} scope={scope} hideUser />
          </Card>
        </>
      )}
    </Shell>
  );
}
