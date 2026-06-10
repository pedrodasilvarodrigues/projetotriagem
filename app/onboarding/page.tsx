import { Building2, UserRoundCheck } from "lucide-react";
import { chooseCompanyAction, chooseProfessionalAction } from "@/lib/actions/onboarding";

export default function OnboardingChoicePage() {
  return (
    <main id="conteudo" className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl flex-col justify-center">
        <p className="text-sm font-medium text-blue-700">Primeiro acesso</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Como deseja utilizar a plataforma?</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Escolha o perfil correto para preparar sua area de trabalho e iniciar o cadastro com as informacoes essenciais.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <form action={chooseProfessionalAction}>
            <button className="h-full w-full rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-blue-300" type="submit">
              <UserRoundCheck aria-hidden="true" className="text-blue-700" size={28} />
              <h2 className="mt-5 text-xl font-semibold">Sou Profissional</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Criar perfil, enviar ou gerar curriculo e entrar no banco de talentos.</p>
            </button>
          </form>
          <form action={chooseCompanyAction}>
            <button className="h-full w-full rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-blue-300" type="submit">
              <Building2 aria-hidden="true" className="text-blue-700" size={28} />
              <h2 className="mt-5 text-xl font-semibold">Sou Empresa</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Cadastrar empresa e preparar o ambiente para criar demandas privadas.</p>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
