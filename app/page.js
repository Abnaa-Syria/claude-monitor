import Link from 'next/link';
import { api, n, fmtNum, fmtTok, fmtCost, qs, href, scopeOf, orgSlot } from '../lib/api';
import { Shell, PageHead, Card, Kpi, Daily, DevelopersTable, ProjectsTable, SessionsTable, ModelsList, Empty } from './ui';
import { IconDollar, IconBolt, IconChat, IconUsers, IconFolder, IconInbox } from './icons';

export const dynamic = 'force-dynamic';

const RANGE_TEXT = { '1': 'اليوم', '7': 'آخر 7 أيام', '30': 'آخر 30 يوم', '90': 'آخر 90 يوم', '3650': 'منذ البداية' };

export default async function Overview({ searchParams }) {
  const scope = scopeOf(await searchParams);
  const q = qs({ days: scope.days, org: scope.org });
  const [ov, meta, recent] = await Promise.all([api(`/api/overview${q}`), api('/api/meta'), api(`/api/sessions${q}`)]);
  const t = ov.totals;
  const orgs = meta.orgs;
  const orgName = scope.org ? orgs.find(o => String(o.id) === scope.org)?.name : null;
  const orgTotal = ov.orgs.reduce((a, o) => a + n(o.cost_usd), 0) || 1;
  const more = (path, label = 'عرض الكل') => <Link className="btn sm" href={href(path, scope)}>{label}</Link>;

  return (
    <Shell active="overview" scope={scope} path="/">
      <PageHead title={orgName || 'نظرة عامة'} sub={`استخدام Claude Code · ${RANGE_TEXT[scope.days] || ''}${orgName ? '' : ' · كل المنظمات'}`} />

      <div className="kpis">
        <Kpi hero icon={IconDollar} label="إجمالي التكلفة" value={fmtCost(t.cost_usd)} note={`${fmtNum(t.requests)} طلب للموديل`} />
        <Kpi icon={IconBolt} label="Tokens (إدخال + إخراج)" value={fmtTok(n(t.input_tokens) + n(t.output_tokens))} note={`Cache: ${fmtTok(n(t.cache_read_tokens) + n(t.cache_creation_tokens))}`} />
        <Kpi icon={IconUsers} label="مطوّرون نشطون" value={fmtNum(t.users)} />
        <Kpi icon={IconChat} label="الجلسات" value={fmtNum(t.sessions)} note={<><span className="num">{fmtNum(t.prompts)}</span> رسالة</>} />
        <Kpi icon={IconFolder} label="المشاريع" value={fmtNum(t.projects)} />
      </div>

      {!scope.org && (
        <div className="orgs">
          {orgs.map(o => {
            const s = ov.orgs.find(x => String(x.k) === String(o.id));
            const cost = n(s?.cost_usd);
            return (
              <Link key={o.id} href={href('/', { ...scope, org: String(o.id) })} className={`card org-card org-${orgSlot(o.id)}`}>
                <div className="top"><span className="name"><i className="dot" />{o.name}</span><span className="faint num">{Math.round((cost / orgTotal) * 100)}%</span></div>
                <div className="cost num">{fmtCost(cost)}</div>
                <div className="share"><i style={{ width: `${(cost / orgTotal) * 100}%` }} /></div>
                <div className="stats">
                  <span>{fmtNum(s?.users)} مطوّر</span><span>{fmtNum(s?.sessions)} جلسة</span><span>{fmtNum(s?.projects)} مشروع</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid g-2">
        <Card title="الاستهلاك اليومي" hint="حسب توقيت القاهرة">
          <Daily daily={ov.daily} scope={scope} orgs={orgs} />
        </Card>
        <Card title="الموديلات" hint="التكلفة حسب الموديل">
          <ModelsList rows={ov.models} />
        </Card>
      </div>

      <Card title="أكثر المطوّرين استهلاكاً" actions={more('/developers')} pad={false}>
        <DevelopersTable rows={ov.users.slice(0, 8)} scope={scope} />
      </Card>

      <div className="grid g-2e">
        <Card title="أحدث الجلسات" actions={more('/sessions')} pad={false}>
          <SessionsTable rows={recent.sessions.slice(0, 6)} scope={scope} compact />
        </Card>
        <Card title="المشاريع النشطة" actions={more('/projects')} pad={false}>
          <ProjectsTable rows={ov.projects.slice(0, 6)} scope={scope} compact />
        </Card>
      </div>
    </Shell>
  );
}
