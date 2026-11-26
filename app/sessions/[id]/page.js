import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, n, fmtNum, fmtTok, fmtCost, fmtDate, fmtTime, scopeOf, splitPrompt, cleanTitle, initials, ENTRY } from '../../../lib/api';
import { Shell, PageHead, Card, Who, ProjectTag, OrgTag, ModelsList } from '../../ui';
import { ConfirmSubmit } from '../../client';
import { deleteSession } from '../../actions';
import { IconTrash, IconBranch } from '../../icons';

export const dynamic = 'force-dynamic';

// ---------- Light Markdown for Claude's replies (bold, inline code, headings, code blocks, tables) ----------
function inline(text, key) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <b key={`${key}-${i}`}>{part.slice(2, -2)}</b>;
    if (/^`[^`]+`$/.test(part)) return <code key={`${key}-${i}`} className="ic">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <code key={`${key}-${i}`} className="ic">{link[1]}</code>;
    return part;
  });
}
function Md({ text }) {
  const out = [];
  const blocks = String(text).split(/```[^\n]*\n?/);
  blocks.forEach((block, bi) => {
    if (bi % 2 === 1) { out.push(<pre key={bi} className="code">{block.replace(/\n$/, '')}</pre>); return; }
    const lines = block.split('\n');
    let table = [];
    const flush = k => { if (table.length) { out.push(<pre key={k} className="code">{table.join('\n')}</pre>); table = []; } };
    lines.forEach((line, li) => {
      const k = `${bi}-${li}`;
      if (/^\s*\|/.test(line)) { if (!/^\s*\|[\s:|-]+\|\s*$/.test(line)) table.push(line.trim()); return; }
      flush(`t${k}`);
      const h = line.match(/^#{1,6}\s+(.*)/);
      if (h) out.push(<div key={k} className="md-h">{inline(h[1], k)}</div>);
      else if (line.trim()) out.push(<div key={k} className="md-p">{inline(line, k)}</div>);
      else out.push(<div key={k} className="md-gap" />);
    });
    flush(`t${bi}-end`);
  });
  return <div className="md" dir="auto">{out}</div>;
}

// ---------- Merge prompts, replies and tool steps into one chronological thread ----------
function buildThread(prompts, replies, actions) {
  const items = [
    ...prompts.map((p, i) => ({ ts: p.ts, o: 0, kind: 'user', n: i + 1, prompt: p.prompt })),
    ...replies.map(r => ({ ts: r.ts, o: 2, kind: 'claude', text: r.text })),
    ...actions.map(a => ({ ts: a.ts, o: 1, kind: 'step', ...a })),
  ].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : a.o - b.o));
  const out = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (it.kind === 'step' && last?.kind === 'steps') last.steps.push(it);
    else if (it.kind === 'step') out.push({ kind: 'steps', ts: it.ts, steps: [it] });
    else out.push(it);
  }
  return out;
}

const TOOL_AR = { Bash: 'أمر', PowerShell: 'أمر', Read: 'قراءة', Edit: 'تعديل', Write: 'إنشاء ملف', Grep: 'بحث', Glob: 'بحث ملفات', WebFetch: 'فتح رابط', WebSearch: 'بحث ويب', Agent: 'مساعد فرعي', mcp_tool: 'أداة خارجية' };

function Steps({ steps }) {
  const counts = {};
  for (const s of steps) counts[s.tool] = (counts[s.tool] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const failed = steps.filter(s => !s.ok).length;
  return (
    <details className="steps">
      <summary>
        <span className="steps-ico">⚙</span>
        <span>نفّذ Claude <b className="num">{fmtNum(steps.length)}</b> {steps.length === 1 ? 'خطوة' : 'خطوات'}</span>
        <span className="steps-tools">{top.map(([t, c]) => <span key={t} className="pill">{TOOL_AR[t] || t} <span className="num">{c}</span></span>)}</span>
        {failed > 0 && <span className="pill bad"><span className="num">{failed}</span> فشلت</span>}
        <span className="faint num" style={{ marginInlineStart: 'auto' }}>{fmtTime(steps[0].ts)}</span>
      </summary>
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={s.ok ? '' : 'bad'}>
            <span className="pill ltr">{s.tool}</span>
            <span className="step-text">
              <span dir="auto">{s.label || '—'}</span>
              {s.detail && <code className="ltr">{s.detail}</code>}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function UserMsg({ item, who }) {
  const { text, ctx } = splitPrompt(item.prompt);
  return (
    <div className="msg">
      <span className="avatar">{initials(who)}</span>
      <div className="bubble">
        <div className="meta"><b>المطوّر</b><span className="num">#{item.n}</span><span className="num">{fmtDate(item.ts)}</span></div>
        {ctx.map((c, j) => (
          <details className="ctx" key={j}>
            <summary><span>📎</span><span className="ltr">{c.label}</span><span className="faint">· سياق من المحرر</span></summary>
            <pre dir="auto">{c.body}</pre>
          </details>
        ))}
        {text ? <Md text={text} /> : <span className="faint">(أرفق سياقاً من المحرر بدون نص)</span>}
      </div>
    </div>
  );
}

function ClaudeMsg({ item }) {
  return (
    <div className="msg claude">
      <span className="avatar claude-av">C</span>
      <div className="bubble">
        <div className="meta"><b>Claude</b><span className="num">{fmtTime(item.ts)}</span></div>
        <Md text={item.text} />
      </div>
    </div>
  );
}

// Requests over time, grouped into at most 40 time buckets so the chart always fits its card.
function RequestsChart({ timeline }) {
  const t = timeline.map(r => ({ at: Date.parse(String(r.ts).replace(' ', 'T') + 'Z'), cost: n(r.cost_usd) }));
  const start = t[0].at, end = t[t.length - 1].at, bins = Math.min(40, t.length);
  const width = Math.max(1, end - start) / bins;
  const buckets = Array.from({ length: bins }, () => ({ cost: 0, count: 0 }));
  for (const r of t) { const b = buckets[Math.min(bins - 1, Math.floor((r.at - start) / width))]; b.cost += r.cost; b.count++; }
  const max = Math.max(...buckets.map(b => b.cost), 0.0001);
  return (
    <div className="mini-chart">
      {buckets.map((b, i) => (
        <span key={i} title={`${fmtNum(b.count)} طلب · ${fmtCost(b.cost)}`} style={{ height: `${b.count ? Math.max(6, (b.cost / max) * 100) : 0}%` }} />
      ))}
    </div>
  );
}

export default async function SessionPage({ params, searchParams }) {
  const { id } = await params;
  const view = (await searchParams)?.view === 'dev' ? 'dev' : 'all';
  const data = await api(`/api/sessions/${encodeURIComponent(id)}`);
  if (!data) notFound();
  const { session: s, prompts, replies = [], actions = [], models, tools, timeline } = data;
  const scope = scopeOf({});
  const title = cleanTitle(s.title) || (s.project_name ? `جلسة على ${s.project_name}` : 'جلسة بدون عنوان');
  const thread = view === 'dev'
    ? prompts.map((p, i) => ({ ts: p.ts, kind: 'user', n: i + 1, prompt: p.prompt }))
    : buildThread(prompts, replies, actions);
  const who = s.user_name || s.user;

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
        <Card title="المحادثة"
          hint={<><span className="num">{fmtNum(prompts.length)}</span> رسالة من المطوّر · <span className="num">{fmtNum(replies.length)}</span> رد من Claude · <span className="num">{fmtNum(actions.length)}</span> خطوة</>}
          actions={
            <div className="seg sm">
              <Link className={view === 'all' ? 'on' : ''} href={`/sessions/${s.session_id}`}>كاملة</Link>
              <Link className={view === 'dev' ? 'on' : ''} href={`/sessions/${s.session_id}?view=dev`}>رسائل المطوّر فقط</Link>
            </div>
          }>
          {thread.length === 0 ? <div className="empty">لا توجد رسائل مسجّلة لهذه الجلسة</div> : (
            <div className="thread">
              {view === 'all' && prompts.length > 0 && replies.length === 0 && (
                <div className="note">ردود Claude غير متاحة لهذه الجلسة: تُسجَّل فقط بعد أن يعيد المطوّر تشغيل VS Code / Cursor مع إعدادات المتابعة.</div>
              )}
              {thread.map((it, i) => it.kind === 'user' ? <UserMsg key={i} item={it} who={who} />
                : it.kind === 'claude' ? <ClaudeMsg key={i} item={it} />
                : <Steps key={i} steps={it.steps} />)}
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
            </div>
          </Card>

          <Card title="الموديلات"><ModelsList rows={models} /></Card>

          {timeline.length > 0 && (
            <Card title="الطلبات عبر الوقت" hint={<><span className="num">{fmtNum(timeline.length)}</span> طلب · ارتفاع العمود = التكلفة</>}>
              <RequestsChart timeline={timeline} />
            </Card>
          )}

          {tools.length > 0 && (
            <Card title="الأدوات التي استخدمها Claude">
              <div className="toolbar">{tools.map(t => <span key={t.tool || 'x'} className="pill ltr">{t.tool || '?'} · <span className="num">{t.n}</span></span>)}</div>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}
