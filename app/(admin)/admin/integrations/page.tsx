import { AppShell } from "@/components/app/shell";
import { DevelopmentModule } from "@/components/app/development-module";

export default function AdminIntegrationsPage() {
  return (
    <AppShell eyebrow="Administrador" title="Integrações">
      <DevelopmentModule moduleName="Integrações futuras" description="Estamos trabalhando nesta funcionalidade. Em breve será possível conectar serviços externos, automações e integrações corporativas." />
    </AppShell>
  );
}
