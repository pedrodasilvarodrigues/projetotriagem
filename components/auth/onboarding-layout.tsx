import Link from "next/link";
import { BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { TermsModal } from "@/components/auth/terms-modal";

export function OnboardingLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
              <BriefcaseBusiness aria-hidden="true" size={21} />
            </span>
            <span>Portal de Triagem</span>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <ShieldCheck aria-hidden="true" size={17} />
            Cadastro protegido por LGPD
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Primeiro acesso</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-3 text-slate-600">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

export function Field({ label, name, type = "text", required = true }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <input name={name} type={type} required={required} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" />
    </label>
  );
}

export function ConsentFields() {
  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <label className="flex gap-3 text-sm text-slate-700">
        <input name="terms" required type="checkbox" className="mt-1" />
        <span>Li e aceito os Termos de Uso. <TermsModal /></span>
      </label>
      <label className="flex gap-3 text-sm text-slate-700">
        <input name="privacy" required type="checkbox" className="mt-1" />
        <span>Li e aceito a Politica de Privacidade. <TermsModal label="Ver Politica" /></span>
      </label>
      <p className="text-xs leading-5 text-slate-500">Registramos data, hora, IP, versao dos termos e versao da politica de privacidade para conformidade LGPD.</p>
    </div>
  );
}

export function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      Verifique os dados informados. Codigo: {error}
    </div>
  );
}
