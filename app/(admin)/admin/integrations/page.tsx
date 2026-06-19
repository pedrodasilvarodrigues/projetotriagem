import { AppShell } from "@/components/app/shell";
import { DevelopmentModule } from "@/components/app/development-module";

export default function AdminIntegrationsPage() {
  return (
    <AppShell eyebrow="Administrador" title="Integracoes">
      <DevelopmentModule moduleName="Integracoes futuras" description="Estamos trabalhando nesta funcionalidade. Em breve sera possivel conectar servicos externos, automacoes e integracoes corporativas." />
    </AppShell>
  );
}
