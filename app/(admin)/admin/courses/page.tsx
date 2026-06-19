import { AppShell } from "@/components/app/shell";
import { DevelopmentModule } from "@/components/app/development-module";

export default function AdminCoursesPage() {
  return (
    <AppShell eyebrow="Administrador" title="Cursos">
      <DevelopmentModule moduleName="Cursos" />
    </AppShell>
  );
}
