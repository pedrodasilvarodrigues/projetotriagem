import { PublicPageShell } from "@/components/app/public-page-shell";

export default function AboutPage() {
  return (
    <PublicPageShell title="Sobre a plataforma" description="Uma plataforma de recrutamento e triagem profissional que organiza banco de talentos, compatibilidade e encaminhamento qualificado.">
      <div className="grid gap-5 md:grid-cols-3">
        {["Banco de talentos organizado", "Triagem com criterios objetivos", "Encaminhamento para empresas"].map((item) => (
          <article key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A plataforma atua como intermediaria entre profissionais e empresas, sem ser apenas um mural de vagas.</p>
          </article>
        ))}
      </div>
    </PublicPageShell>
  );
}
