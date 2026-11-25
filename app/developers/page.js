import { api, qs, scopeOf, fmtNum } from '../../lib/api';
import { Shell, PageHead, Card, DevelopersTable } from '../ui';
import { IconDownload } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Developers({ searchParams }) {
  const scope = scopeOf(await searchParams);
  const q = qs({ days: scope.days, org: scope.org });
  const ov = await api(`/api/overview${q}`);
  return (
    <Shell active="developers" scope={scope} path="/developers">
      <PageHead title="المطوّرون" sub={`${fmtNum(ov.users.length)} مطوّر نشط في هذه الفترة`}
        actions={<a className="btn" href={`/export${qs({ type: 'developers', days: scope.days, org: scope.org })}`}><IconDownload />تصدير CSV</a>} />
      <Card pad={false}>
        <DevelopersTable rows={ov.users} scope={scope} />
      </Card>
    </Shell>
  );
}
