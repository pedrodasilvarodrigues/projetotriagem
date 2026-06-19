import { AppShell } from "@/components/app/shell";
import { DevelopmentModule } from "@/components/app/development-module";

export default function AdminTrainingsPage() {
  return (
    <AppShell eyebrow="Administrador" title="Treinamentos">
      <DevelopmentModule moduleName="Treinamentos" description="Estamos trabalhando nesta funcionalidade. Em breve sera possivel organizar trilhas, treinamentos e materiais de apoio." />
    </AppShell>
  );
}
