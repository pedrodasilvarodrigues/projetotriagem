"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { BirthDateInput } from "@/components/auth/birth-date-input";
import { ConsentFields } from "@/components/auth/onboarding-layout";
import { registerProfessionalWithEmailAction } from "@/lib/actions/auth";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  return digits(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  return digits(value).slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function maskCep(value: string) {
  return digits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

const errorMessages: Record<string, string> = {
  "dados-invalidos": "Revise os campos obrigatórios e confira CPF, telefone, CEP e data de nascimento.",
  "email-ja-cadastrado": "Esse e-mail já possui cadastro. Volte para o acesso ou use outro e-mail.",
  "cpf-ja-cadastrado": "Esse CPF já possui cadastro no portal.",
  "senha-invalida": "A senha precisa ter pelo menos 6 caracteres.",
  "configuracao-supabase-incompleta": "Configuração do Supabase pendente. Adicione as variáveis de ambiente seguras na Vercel.",
  "nao-foi-possivel-criar-conta": "Não foi possível criar a conta agora. Tente novamente em instantes."
};

export function ProfessionalRegisterForm({ error }: { error?: string }) {
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function lookupCep(value: string) {
    const rawCep = digits(value);
    if (rawCep.length !== 8) return;
    setCepStatus("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        setCepStatus("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
      setCepStatus("Endereço preenchido automaticamente.");
    } catch {
      setCepStatus("Não foi possível consultar o CEP. Preencha manualmente.");
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 placeholder:text-slate-400 font-medium shadow-inner";

  return (
    <form action={registerProfessionalWithEmailAction} onSubmit={() => setSubmitting(true)} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium" role="alert">
          {errorMessages[error] ?? `Verifique os dados informados. Código: ${error}`}
        </div>
      ) : null}

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 text-sm font-bold text-blue-700 font-display md:col-span-2">Dados de acesso</legend>
        <label className="block text-sm font-bold text-slate-800">
          Email
          <input name="email" required type="email" autoComplete="email" className={inputClass} placeholder="seu@email.com" />
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

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 text-sm font-bold text-blue-700 font-display md:col-span-2">Dados profissionais</legend>
        <label className="block text-sm font-bold text-slate-800">
          Nome Completo
          <input name="fullName" required autoComplete="name" className={inputClass} placeholder="Nome completo" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          CPF
          <input name="cpf" required inputMode="numeric" value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} className={inputClass} placeholder="000.000.000-00" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Telefone
          <input name="phone" required inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className={inputClass} placeholder="(00) 00000-0000" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Data de Nascimento
          <BirthDateInput className={inputClass} />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 flex items-center gap-2 text-sm font-bold text-blue-700 font-display md:col-span-2">
          <MapPin aria-hidden="true" size={16} />
          Endereço
        </legend>
        <label className="block text-sm font-bold text-slate-800">
          CEP
          <input name="cep" required inputMode="numeric" value={cep} onBlur={(event) => lookupCep(event.target.value)} onChange={(event) => setCep(maskCep(event.target.value))} className={inputClass} placeholder="00000-000" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Número
          <input name="addressNumber" required autoComplete="address-line2" className={inputClass} placeholder="Nº" />
        </label>
        <label className="block text-sm font-bold text-slate-800 md:col-span-2">
          Endereço
          <input name="street" required value={street} onChange={(event) => setStreet(event.target.value)} autoComplete="address-line1" className={inputClass} placeholder="Rua / Avenida..." />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Bairro
          <input name="neighborhood" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className={inputClass} placeholder="Bairro" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Cidade
          <input name="city" required value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className={inputClass} placeholder="Cidade" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Estado
          <input name="state" required value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} autoComplete="address-level1" className={inputClass} placeholder="UF" />
        </label>
      </fieldset>

      {cepStatus ? <p className="text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200" aria-live="polite">{cepStatus}</p> : null}

      <ConsentFields />

      <button disabled={submitting} className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer" type="submit">
        {submitting ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : null}
        Criar cadastro
      </button>
    </form>
  );
}
