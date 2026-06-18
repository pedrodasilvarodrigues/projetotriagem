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
  "dados-invalidos": "Revise os campos obrigatorios e confira CPF, telefone, CEP e data de nascimento.",
  "email-ja-cadastrado": "Esse email ja possui cadastro. Volte para login ou use outro email.",
  "cpf-ja-cadastrado": "Esse CPF ja possui cadastro no portal.",
  "senha-invalida": "A senha precisa ter pelo menos 6 caracteres.",
  "configuracao-supabase-incompleta": "Configuracao do Supabase pendente. Adicione as variaveis de ambiente seguras na Vercel.",
  "nao-foi-possivel-criar-conta": "Nao foi possivel criar a conta agora. Tente novamente em instantes."
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
        setCepStatus("CEP nao encontrado. Preencha o endereco manualmente.");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
      setCepStatus("Endereco preenchido automaticamente.");
    } catch {
      setCepStatus("Nao foi possivel consultar o CEP. Preencha manualmente.");
    }
  }

  return (
    <form action={registerProfessionalWithEmailAction} onSubmit={() => setSubmitting(true)} className="space-y-5">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errorMessages[error] ?? `Verifique os dados informados. Codigo: ${error}`}
        </div>
      ) : null}

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-slate-950 md:col-span-2">Dados de acesso</legend>
        <label className="block text-sm font-medium text-slate-800">
          Email
          <input name="email" required type="email" autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Senha
          <span className="mt-1 flex rounded-md border border-slate-300 bg-white focus-within:border-blue-700">
            <input name="password" required type={showPassword ? "text" : "password"} minLength={6} autoComplete="new-password" className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none" />
            <button aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="px-3 text-slate-500" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-slate-950 md:col-span-2">Dados profissionais</legend>
        <label className="block text-sm font-medium text-slate-800">
          Nome Completo
          <input name="fullName" required autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          CPF
          <input name="cpf" required inputMode="numeric" value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Telefone
          <input name="phone" required inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Data de Nascimento
          <BirthDateInput className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-950 md:col-span-2">
          <MapPin aria-hidden="true" size={16} />
          Endereco
        </legend>
        <label className="block text-sm font-medium text-slate-800">
          CEP
          <input name="cep" required inputMode="numeric" value={cep} onBlur={(event) => lookupCep(event.target.value)} onChange={(event) => setCep(maskCep(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Numero
          <input name="addressNumber" required autoComplete="address-line2" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800 md:col-span-2">
          Endereco
          <input name="street" required value={street} onChange={(event) => setStreet(event.target.value)} autoComplete="address-line1" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Bairro
          <input name="neighborhood" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Cidade
          <input name="city" required value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Estado
          <input name="state" required value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} autoComplete="address-level1" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition focus:border-blue-700" />
        </label>
      </fieldset>

      {cepStatus ? <p className="text-sm text-slate-600" aria-live="polite">{cepStatus}</p> : null}

      <ConsentFields />

      <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400" type="submit">
        {submitting ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : null}
        Criar cadastro
      </button>
    </form>
  );
}
