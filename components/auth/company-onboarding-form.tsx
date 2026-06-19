"use client";

import { useState } from "react";
import { ConsentFields } from "@/components/auth/onboarding-layout";
import { saveCompanyAction } from "@/lib/actions/onboarding";

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

export function CompanyOnboardingForm({ email, error }: { email: string; error?: string }) {
  const [cnpj, setCnpj] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [corporateEmail, setCorporateEmail] = useState(email);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState("");

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
      setCorporateEmail(data.email ?? email);
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

  return (
    <form action={saveCompanyAction} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error ? <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">Verifique os dados informados. Código: {error}</div> : null}
      <section>
        <h2 className="text-lg font-semibold">Dados da empresa</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium">CNPJ<input name="cnpj" required value={cnpj} onBlur={(event) => lookupCnpj(event.target.value)} onChange={(event) => setCnpj(maskCnpj(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Razão Social<input name="legalName" required value={legalName} onChange={(event) => setLegalName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Nome Fantasia<input name="tradeName" required value={tradeName} onChange={(event) => setTradeName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Telefone<input name="phone" required value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Email Corporativo (opcional)<input name="corporateEmail" type="email" value={corporateEmail} onChange={(event) => setCorporateEmail(event.target.value)} placeholder="Usaremos o email da conta se ficar vazio" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">CEP<input name="cep" required value={cep} onChange={(event) => setCep(maskCep(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium lg:col-span-2">Endereço<input name="street" required value={street} onChange={(event) => setStreet(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Número<input name="addressNumber" required value={number} onChange={(event) => setNumber(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Bairro<input name="neighborhood" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Cidade<input name="city" required value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Estado<input name="state" required value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>
        {status ? <p className="mt-3 text-sm text-slate-600" aria-live="polite">{status}</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Responsável</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium">Nome<input name="contactName" required autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Cargo<input name="contactRole" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium">Telefone<input name="contactPhone" required value={contactPhone} onChange={(event) => setContactPhone(maskPhone(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>
      </section>
      <div className="mt-6"><ConsentFields /></div>
      <button className="mt-6 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Finalizar cadastro</button>
    </form>
  );
}
