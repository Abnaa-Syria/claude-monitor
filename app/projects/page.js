import { api, qs, scopeOf, fmtNum } from '../../lib/api';
import { Shell, PageHead, Card, ProjectsTable } from '../ui';
import { IconDownload } from '../icons';

export const dynamic = 'force-dynamic';

export default async function Projects({ searchParams }) {
  const scope = scopeOf(await searchParams);
  const q = qs({ days: scope.days, org: scope.org });
  const ov = await api(`/api/overview${q}`);
  return (
    <Shell active="projects" scope={scope} path="/projects">
      <PageHead title="المشاريع" sub={`${fmtNum(ov.projects.length)} مشروع · اسم المشروع هو اسم المجلد الذي يعمل فيه المطوّر`}
        actions={<a className="btn" href={`/export${qs({ type: 'projects', days: scope.days, org: scope.org })}`}><IconDownload />تصدير CSV</a>} />
      <Card pad={false}>
        <ProjectsTable rows={ov.projects} scope={scope} />
      </Card>
    </Shell>
  );
}
