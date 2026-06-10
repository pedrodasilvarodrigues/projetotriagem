import { AppShell } from "@/components/app/shell";
import { OperationalPage } from "@/components/app/operational-page";
import type { PageContent } from "@/lib/page-content";

export function PageRenderer({ page }: { page: PageContent }) {
  return (
    <AppShell eyebrow={page.eyebrow} title={page.title}>
      <OperationalPage
        description={page.description}
        metrics={page.metrics}
        actions={page.actions}
        columns={page.columns}
        rows={page.rows}
        formTitle={page.formTitle}
        formFields={page.formFields}
        timeline={page.timeline}
      />
    </AppShell>
  );
}
