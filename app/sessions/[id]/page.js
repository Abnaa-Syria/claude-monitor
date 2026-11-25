import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, n, fmtNum, fmtTok, fmtCost, fmtDate, fmtTime, scopeOf, splitPrompt, cleanTitle, initials, ENTRY } from '../../../lib/api';
import { Shell, PageHead, Card, Who, ProjectTag, OrgTag, ModelsList } from '../../ui';
import { ConfirmSubmit } from '../../client';
import { deleteSession } from '../../actions';
import { IconTrash, IconBranch } from '../../icons';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }) {
  const { id } = await params;
  const data = await api(`/api/sessions/${encodeURIComponent(id)}`);
  if (!data) notFound();
  const { session: s, prompts, models, tools, timeline } = data;
  const scope = scopeOf({});
  const title = cleanTitle(s.title) || 'جلسة بدون عنوان';
  const maxReq = Math.max(...timeline.map(r => n(r.cost_usd)), 0.0001);

  return (
    <Shell active="sessions" scope={scope} path="/sessions" showScope={false}>
      <PageHead crumbs={<><Link href="/sessions">الجلسات</Link><span>/</span></>} title={title}
        sub={`${ENTRY[s.entrypoint] || s.entrypoint || 'Claude Code'} · ${fmtDate(s.started_at)} ← ${fmtDate(s.last_activity)}`}
        actions={
          <form action={deleteSession}>
            <input type="hidden" name="id" value={s.session_id} />
            <ConfirmSubmit message="حذف هذه الجلسة وكل رسائلها نهائياً؟ استخدمه إذا كانت فيها بيانات حساسة."><IconTrash />حذف الجلسة</ConfirmSubmit>
          </form>
        } />

      <div className="split">
        <Card title={`رسائل المطوّر (${fmtNum(prompts.length)})`} hint="ما كتبه المطوّر لـ Claude بالترتيب">
          {prompts.length === 0 ? <div className="empty">لا توجد رسائل مسجّلة لهذه الجلسة</div> : (
            <div className="thread">
              {prompts.map((pr, i) => {
                const { text, ctx } = splitPrompt(pr.prompt);
                return (
                  <div className="msg" key={i}>
                    <span className="avatar">{initials(s.user_name)}</span>
                    <div className="bubble">
                      <div className="meta"><b className="num">#{i + 1}</b><span className="num">{fmtDate(pr.ts)}</span></div>
                      {ctx.map((c, j) => (
                        <details className="ctx" key={j}>
                          <summary><span>📎</span><span className="ltr">{c.label}</span><span className="faint">· سياق من المحرر</span></summary>
                          <pre dir="auto">{c.body}</pre>
                        </details>
                      ))}
                      {text ? <pre dir="auto">{text}</pre> : <span className="faint">(سياق فقط بدون نص)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="aside">
          <Card title="التفاصيل">
            <div className="facts">
              <div className="fact"><span className="k">المطوّر</span><span className="v"><Who user={s.user} name={s.user_name} scope={scope} /></span></div>
              <div className="fact"><span className="k">المنظمة</span><span className="v"><OrgTag id={s.org_id} name={s.org_name} /></span></div>
              <div className="fact"><span className="k">المشروع</span><span className="v"><ProjectTag name={s.project_name} scope={scope} /></span></div>
              {s.git_branch && <div className="fact"><span className="k">الفرع</span><span className="v ltr"><IconBranch style={{ width: 14, verticalAlign: -2 }} /> {s.git_branch}</span></div>}
              <div className="fact"><span className="k">المسار</span><span className="v ltr faint" style={{ fontSize: 12 }}>{s.project_dir || '—'}</span></div>
              <div className="fact"><span className="k">الجهاز</span><span className="v ltr">{[s.os_user, s.host].filter(Boolean).join(' @ ') || '—'}</span></div>
              <div className="fact"><span className="k">التكلفة</span><span className="v"><b className="num" style={{ fontSize: 18 }}>{fmtCost(s.cost_usd)}</b></span></div>
              <div className="fact"><span className="k">Tokens</span><span className="v"><span className="num">{fmtTok(s.input_tokens)}</span> إدخال · <span className="num">{fmtTok(s.output_tokens)}</span> إخراج</span></div>
              <div className="fact"><span className="k">Cache</span><span className="v num">{fmtTok(n(s.cache_read_tokens) + n(s.cache_creation_tokens))}</span></div>
              <div className="fact"><span className="k">معرّف الجلسة</span><span className="v ltr faint" style={{ fontSize: 11.5 }}>{s.session_id}</span></div>
            </div>
          </Card>

          <Card title="الموديلات"><ModelsList rows={models} /></Card>

          {timeline.length > 0 && (
            <Card title="الطلبات عبر الوقت" hint={`${fmtNum(timeline.length)} طلب · ارتفاع العمود = التكلفة`}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 70, direction: 'ltr' }}>
                {timeline.map((r, i) => (
                  <span key={i} title={`${fmtTime(r.ts)} · ${r.model} · ${fmtCost(r.cost_usd)} · ${fmtTok(n(r.input_tokens) + n(r.output_tokens))} tokens`}
                    style={{ flex: 1, minWidth: 2, maxWidth: 14, height: `${Math.max(4, (n(r.cost_usd) / maxReq) * 100)}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />
                ))}
              </div>
            </Card>
          )}

          {tools.length > 0 && (
            <Card title="الأدوات التي استخدمها Claude">
              <div className="toolbar">{tools.map(t => <span key={t.tool || 'x'} className="pill ltr">{t.tool || '?'} · {t.n}</span>)}</div>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}
