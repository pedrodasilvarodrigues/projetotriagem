"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ConsentFields } from "@/components/auth/onboarding-layout";
import { registerCompanyWithEmailAction } from "@/lib/actions/auth";

type BrasilApiCnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  ddd_telefone_1?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCnpj(value: string) {
  return digits(value).slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  return digits(value).slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function maskCep(value: string) {
  return digits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

const errorMessages: Record<string, string> = {
  "dados-invalidos": "Revise os campos obrigatórios. O e-mail corporativo pode ficar em branco se a empresa não tiver um e-mail próprio.",
  "email-ja-cadastrado": "Esse e-mail já possui cadastro. Volte para o acesso ou use outro e-mail.",
  "cnpj-ja-cadastrado": "Esse CNPJ já possui cadastro no portal.",
  "senha-invalida": "A senha precisa ter pelo menos 6 caracteres.",
  "configuracao-supabase-incompleta": "Configuração do Supabase pendente. Adicione as variáveis de ambiente seguras na Vercel.",
  "nao-foi-possivel-criar-conta": "Não foi possível criar a conta agora. Tente novamente em instantes."
};

export function CompanyRegisterForm({ error }: { error?: string }) {
  const [cnpj, setCnpj] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function lookupCnpj(value: string) {
    const rawCnpj = digits(value);
    if (rawCnpj.length !== 14) return;
    setStatus("Consultando CNPJ...");
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
      if (!response.ok) {
        setStatus("CNPJ não encontrado. Preencha manualmente.");
        return;
      }
      const data = (await response.json()) as BrasilApiCnpj;
      setLegalName(data.razao_social ?? "");
      setTradeName(data.nome_fantasia || data.razao_social || "");
      setPhone(data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : "");
      setCorporateEmail(data.email ?? "");
      setCep(data.cep ? maskCep(data.cep) : "");
      setStreet(data.logradouro ?? "");
      setNumber(data.numero ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.municipio ?? "");
      setState(data.uf ?? "");
      setStatus("Dados da empresa preenchidos automaticamente.");
    } catch {
      setStatus("Não foi possível consultar o CNPJ. Preencha manualmente.");
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 placeholder:text-slate-400 font-medium shadow-inner";

  return (
    <form action={registerCompanyWithEmailAction} onSubmit={() => setSubmitting(true)} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium" role="alert">
          {errorMessages[error] ?? `Verifique os dados informados. Código: ${error}`}
        </div>
      ) : null}

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 text-sm font-bold text-blue-700 font-display md:col-span-2">Dados de acesso</legend>
        <label className="block text-sm font-bold text-slate-800">
          Email de acesso
          <input name="email" required type="email" autoComplete="email" className={inputClass} placeholder="empresa@site.com" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Senha
          <span className="mt-2 flex rounded-xl border border-slate-300 bg-slate-50 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 shadow-inner">
            <input name="password" required type={showPassword ? "text" : "password"} minLength={6} autoComplete="new-password" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-3 text-sm text-slate-950 outline-none font-medium" placeholder="Mínimo 6 caracteres" />
            <button aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="px-3 text-slate-400 hover:text-orange-500 transition cursor-pointer" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-1 text-sm font-bold text-blue-700 font-display md:col-span-2 lg:col-span-3">Dados da empresa</legend>
        <label className="block text-sm font-bold text-slate-800">CNPJ<input name="cnpj" required value={cnpj} onBlur={(event) => lookupCnpj(event.target.value)} onChange={(event) => setCnpj(maskCnpj(event.target.value))} className={inputClass} placeholder="00.000.000/0000-00" /></label>
        <label className="block text-sm font-bold text-slate-800">Razão Social<input name="legalName" required value={legalName} onChange={(event) => setLegalName(event.target.value)} className={inputClass} placeholder="Nome Oficial da Empresa" /></label>
        <label className="block text-sm font-bold text-slate-800">Nome Fantasia<input name="tradeName" required value={tradeName} onChange={(event) => setTradeName(event.target.value)} className={inputClass} placeholder="Nome Comercial" /></label>
        <label className="block text-sm font-bold text-slate-800">Telefone<input name="phone" required value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className={inputClass} placeholder="(00) 00000-0000" /></label>
        <label className="block text-sm font-bold text-slate-800">Email Corporativo (opcional)<input name="corporateEmail" type="email" value={corporateEmail} onChange={(event) => setCorporateEmail(event.target.value)} placeholder="Opcional" className={inputClass} /></label>
        <label className="block text-sm font-bold text-slate-800">CEP<input name="cep" required value={cep} onChange={(event) => setCep(maskCep(event.target.value))} className={inputClass} placeholder="00000-000" /></label>
        <label className="block text-sm font-bold text-slate-800 lg:col-span-2">Endereço<input name="street" required value={street} onChange={(event) => setStreet(event.target.value)} className={inputClass} placeholder="Rua / Avenida..." /></label>
        <label className="block text-sm font-bold text-slate-800">Número<input name="addressNumber" required value={number} onChange={(event) => setNumber(event.target.value)} className={inputClass} placeholder="Nº" /></label>
        <label className="block text-sm font-bold text-slate-800">Bairro<input name="neighborhood" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className={inputClass} placeholder="Bairro" /></label>
        <label className="block text-sm font-bold text-slate-800">Cidade<input name="city" required value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="Cidade" /></label>
        <label className="block text-sm font-bold text-slate-800">Estado<input name="state" required value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="UF" /></label>
      </fieldset>

      {status ? <p className="text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200" aria-live="polite">{status}</p> : null}

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="mb-1 text-sm font-bold text-blue-700 font-display md:col-span-3">Responsável</legend>
        <label className="block text-sm font-bold text-slate-800">Nome<input name="contactName" required autoComplete="name" className={inputClass} placeholder="Nome do responsável" /></label>
        <label className="block text-sm font-bold text-slate-800">Cargo<input name="contactRole" required className={inputClass} placeholder="Cargo na empresa" /></label>
        <label className="block text-sm font-bold text-slate-800">Telefone<input name="contactPhone" required value={contactPhone} onChange={(event) => setContactPhone(maskPhone(event.target.value))} className={inputClass} placeholder="(00) 00000-0000" /></label>
      </fieldset>

      <ConsentFields />

      <button disabled={submitting} className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer" type="submit">
        {submitting ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : null}
        Criar cadastro empresarial
      </button>
    </form>
  );
}
