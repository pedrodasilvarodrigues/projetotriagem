"use client";

import { useState } from "react";
import { BirthDateInput } from "@/components/auth/birth-date-input";
import { ConsentFields } from "@/components/auth/onboarding-layout";
import { saveProfessionalBasicsAction } from "@/lib/actions/onboarding";

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

export function ProfessionalOnboardingForm({ email, error }: { email: string; error?: string }) {
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepStatus, setCepStatus] = useState("");

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

  return (
    <form action={saveProfessionalBasicsAction} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error ? <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">Verifique os dados informados. Código: {error}</div> : null}
      <h2 className="text-lg font-semibold">Dados pessoais</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">Nome Completo<input name="fullName" required pattern="^[A-Za-zÀ-ÿ\\s]+$" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">CPF<input name="cpf" required inputMode="numeric" value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Telefone<input name="phone" required inputMode="numeric" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Email<input name="email" required type="email" defaultValue={email} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Data de Nascimento<BirthDateInput className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">CEP<input name="cep" required inputMode="numeric" value={cep} onBlur={(event) => lookupCep(event.target.value)} onChange={(event) => setCep(maskCep(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800 md:col-span-2">Endereço<input name="street" required value={street} onChange={(event) => setStreet(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Número<input name="addressNumber" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Bairro<input name="neighborhood" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Cidade<input name="city" required value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-sm font-medium text-slate-800">Estado<input name="state" required value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
      </div>
      {cepStatus ? <p className="mt-3 text-sm text-slate-600" aria-live="polite">{cepStatus}</p> : null}
      <div className="mt-5"><ConsentFields /></div>
      <button className="mt-6 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Continuar</button>
    </form>
  );
}
