import { api, fmtNum, fmtAgo, orgSlot, scopeOf } from '../../lib/api';
import { settingsFor } from '../../lib/settings-template';
import { Shell, PageHead, Card } from '../ui';
import { CopyButton } from '../client';
import { renameOrg, addOrg, setDisplayName } from '../actions';
import { IconDownload } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const meta = await api('/api/meta');
  const scope = scopeOf({});

  return (
    <Shell active="settings" scope={scope} path="/settings" showScope={false}>
      <PageHead title="الإعدادات" sub="المنظمات وملفات الربط وأسماء المطوّرين" />

      <Card title="المنظمات" hint="كل منظمة على Claude لها مفتاح خاص؛ البيانات تُنسب للمنظمة حسب المفتاح" pad={false}>
        {meta.orgs.map(o => {
          const json = settingsFor(o.ingest_key);
          return (
            <div className={`settings-org org-${orgSlot(o.id)}`} key={o.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                <form action={renameOrg} className="inline-form">
                  <i className="dot" />
                  <input type="hidden" name="id" value={o.id} />
                  <input className="input" name="name" defaultValue={o.name} required style={{ width: 220 }} />
                  <button className="btn sm" type="submit">حفظ الاسم</button>
                </form>
                <div className="faint" style={{ fontSize: 12.5 }}>
                  {fmtNum(o.sessions)} جلسة · {fmtNum(o.users)} مطوّر · آخر نشاط {fmtAgo(o.last_activity)}
                  {' · '}المفتاح <span className="key ltr">{o.ingest_key.slice(0, 6)}…{o.ingest_key.slice(-4)}</span>
                </div>
              </div>
              <div className="inline-form">
                <CopyButton text={json} label="نسخ ملف الإعدادات" />
                <a className="btn sm" download={`claude-managed-settings-${o.id}.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}><IconDownload />تنزيل</a>
              </div>
            </div>
          );
        })}
        <form action={addOrg} className="settings-org" style={{ gridTemplateColumns: '1fr' }}>
          <div className="inline-form">
            <input className="input" name="name" placeholder="اسم منظمة جديدة" required style={{ width: 220 }} />
            <button className="btn primary sm" type="submit">إضافة منظمة</button>
          </div>
        </form>
      </Card>

      <Card title="طريقة الربط لكل منظمة">
        <ol className="steps">
          <li>اضغط <b>نسخ ملف الإعدادات</b> بجانب المنظمة.</li>
          <li>افتح <span className="ltr">claude.ai/admin-settings/claude-code</span> وأنت داخل <b>نفس المنظمة</b>، والصق الملف في خانة Managed settings واحفظ.</li>
          <li>اطلب من المطوّرين إغلاق VS Code / Cursor وفتحه من جديد، والموافقة على رسالة الإعدادات إن ظهرت.</li>
          <li>أول ما يرسل المطوّر رسالة ويرد Claude، تظهر الجلسة هنا خلال ثوانٍ.</li>
        </ol>
      </Card>

      <Card title="أسماء المطوّرين" hint="اكتب اسم كل مطوّر ليظهر بدل الإيميل في كل الصفحات. اتركه فارغاً للرجوع للإيميل." pad={false}>
        <div className="table-wrap" id="people">
          <table>
            <thead><tr><th>الإيميل</th><th>الاسم الظاهر</th><th>آخر نشاط</th></tr></thead>
            <tbody>
              {meta.people.length === 0 && <tr><td colSpan={3} className="empty">لم يظهر أي مطوّر بعد</td></tr>}
              {meta.people.map(p => (
                <tr key={p.email}>
                  <td className="ltr">{p.email}</td>
                  <td>
                    <form action={setDisplayName} className="inline-form">
                      <input type="hidden" name="email" value={p.email} />
                      <input className="input" name="display_name" defaultValue={p.display_name || ''} placeholder="مثال: أحمد محمد" style={{ width: 200 }} />
                      <button className="btn sm" type="submit">حفظ</button>
                    </form>
                  </td>
                  <td className="faint">{fmtAgo(p.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
