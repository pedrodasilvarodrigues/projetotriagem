import { AppShell } from "@/components/app/shell";
import { DevelopmentModule } from "@/components/app/development-module";

export default function AdminInstitutionsPage() {
  return (
    <AppShell eyebrow="Administrador" title="Instituicoes">
      <DevelopmentModule moduleName="Instituicoes" description="Estamos trabalhando nesta funcionalidade. Em breve sera possivel gerenciar instituicoes parceiras e certificadoras." />
    </AppShell>
  );
}
