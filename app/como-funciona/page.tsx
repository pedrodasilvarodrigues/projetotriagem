import { PublicPageShell } from "@/components/app/public-page-shell";

const steps = ["Cadastro", "Banco de Talentos", "Compatibilidade", "Validação do recrutador", "Encaminhamento"];

export default function HowItWorksPage() {
  return (
    <PublicPageShell title="Como funciona" description="O processo combina cadastro, análise automática e validação humana antes de encaminhar candidatos para empresas.">
      <ol className="grid gap-4 md:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">{index + 1}</span>
            <h2 className="mt-4 font-semibold">{step}</h2>
          </li>
        ))}
      </ol>
    </PublicPageShell>
  );
}
