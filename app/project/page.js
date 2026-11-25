import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, n, qs, href, scopeOf, fmtNum, fmtTok, fmtCost, fmtAgo } from '../../lib/api';
import { Shell, PageHead, Card, Kpi, Daily, SessionsTable, DevelopersTable, ModelsList } from '../ui';
import { IconDollar, IconBolt, IconChat, IconUsers } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Project({ searchParams }) {
  const params = await searchParams;
  const scope = scopeOf(params);
  const name = params.name;
  if (!name) notFound();
  const [d, meta] = await Promise.all([api(`/api/project${qs({ project: name, days: scope.days, org: scope.org })}`), api('/api/meta')]);
  const t = d?.totals;
  const dirs = [...new Set((d?.sessions || []).map(s => s.project_dir).filter(Boolean))];
  const branches = [...new Set((d?.sessions || []).map(s => s.git_branch).filter(Boolean))];

  return (
    <Shell active="projects" scope={scope} path="/project" extra={{ name }}>
      <PageHead crumbs={<><Link href={href('/projects', scope)}>المشاريع</Link><span>/</span></>} title={<span className="ltr">{name}</span>}
        sub={<span className="ltr">{dirs.slice(0, 2).join(' · ')}{branches.length ? ` · branches: ${branches.slice(0, 4).join(', ')}` : ''}</span>} />
      {!d ? <Card><div className="empty">لا يوجد نشاط على هذا المشروع في الفترة المحددة</div></Card> : (
        <>
          <div className="kpis">
            <Kpi hero icon={IconDollar} label="التكلفة" value={fmtCost(t.cost_usd)} note={`${fmtNum(t.requests)} طلب`} />
            <Kpi icon={IconBolt} label="Tokens" value={fmtTok(n(t.input_tokens) + n(t.output_tokens))} />
            <Kpi icon={IconUsers} label="المطوّرون" value={fmtNum(t.users)} />
            <Kpi icon={IconChat} label="الجلسات" value={fmtNum(t.sessions)} note={<><span className="num">{fmtNum(t.prompts)}</span> رسالة</>} />
          </div>
          <div className="grid g-2">
            <Card title="الاستهلاك اليومي"><Daily daily={d.daily} scope={scope} orgs={meta.orgs} height={200} /></Card>
            <Card title="الموديلات"><ModelsList rows={d.models} /></Card>
          </div>
          <Card title="المطوّرون على المشروع" pad={false}><DevelopersTable rows={d.users} scope={scope} /></Card>
          <Card title="الجلسات" pad={false}><SessionsTable rows={d.sessions} scope={scope} hideProject /></Card>
        </>
      )}
    </Shell>
  );
}
