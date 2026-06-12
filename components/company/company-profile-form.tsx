"use client";

import { useState } from "react";

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

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type CompanyProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  company: {
    legal_name?: string | null;
    trade_name?: string | null;
    cnpj?: string | null;
    corporate_email?: string | null;
    phone?: string | null;
    cep?: string | null;
    street?: string | null;
    address_number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    status?: string | null;
    segment?: string | null;
    description?: string | null;
  } | null;
  contact?: {
    name?: string | null;
    role_title?: string | null;
    phone?: string | null;
  } | null;
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

export function CompanyProfileForm({ action, company, contact }: CompanyProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [cnpj, setCnpj] = useState(maskCnpj(company?.cnpj ?? ""));
  const [legalName, setLegalName] = useState(company?.legal_name ?? "");
  const [tradeName, setTradeName] = useState(company?.trade_name ?? "");
  const [corporateEmail, setCorporateEmail] = useState(company?.corporate_email ?? "");
  const [phone, setPhone] = useState(maskPhone(company?.phone ?? ""));
  const [cep, setCep] = useState(maskCep(company?.cep ?? ""));
  const [street, setStreet] = useState(company?.street ?? "");
  const [addressNumber, setAddressNumber] = useState(company?.address_number ?? "");
  const [neighborhood, setNeighborhood] = useState(company?.neighborhood ?? "");
  const [city, setCity] = useState(company?.city ?? "");
  const [state, setState] = useState(company?.state ?? "");
  const [contactPhone, setContactPhone] = useState(maskPhone(contact?.phone ?? ""));

  async function lookupCnpj(value: string) {
    const rawCnpj = digits(value);
    if (rawCnpj.length !== 14) return;
    setStatusMessage("Consultando CNPJ...");
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
      if (!response.ok) {
        setStatusMessage("CNPJ nao encontrado. Continue preenchendo manualmente.");
        return;
      }
      const data = (await response.json()) as BrasilApiCnpj;
      setLegalName(data.razao_social ?? "");
      setTradeName(data.nome_fantasia || data.razao_social || "");
      setPhone(data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : phone);
      setCorporateEmail(data.email ?? corporateEmail);
      setCep(data.cep ? maskCep(data.cep) : cep);
      setStreet(data.logradouro ?? "");
      setAddressNumber(data.numero ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.municipio ?? "");
      setState(data.uf ?? "");
      setStatusMessage("Dados do CNPJ preenchidos automaticamente.");
    } catch {
      setStatusMessage("Nao foi possivel consultar o CNPJ. Continue preenchendo manualmente.");
    }
  }

  async function lookupCep(value: string) {
    const rawCep = digits(value);
    if (rawCep.length !== 8) return;
    setStatusMessage("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        setStatusMessage("CEP nao encontrado. Continue preenchendo manualmente.");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
      setStatusMessage("Endereco preenchido automaticamente.");
    } catch {
      setStatusMessage("Nao foi possivel consultar o CEP. Continue preenchendo manualmente.");
    }
  }

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">Os dados do cadastro da empresa ficam aqui e podem ser atualizados quando necessario.</p>
          <p className="mt-2 text-sm text-slate-500">Status: {company?.status ?? "pending"}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
          <button
            type="submit"
            disabled={!editing}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">CNPJ<input name="cnpj" required disabled={!editing} value={cnpj} onBlur={(event) => lookupCnpj(event.target.value)} onChange={(event) => setCnpj(maskCnpj(event.target.value))} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Razao social<input name="legalName" required disabled={!editing} value={legalName} onChange={(event) => setLegalName(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Nome fantasia<input name="tradeName" required disabled={!editing} value={tradeName} onChange={(event) => setTradeName(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Email corporativo<input name="corporateEmail" required type="email" disabled={!editing} value={corporateEmail} onChange={(event) => setCorporateEmail(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Telefone<input name="phone" required disabled={!editing} value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Segmento<input name="segment" required disabled={!editing} defaultValue={company?.segment ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">CEP<input name="cep" required disabled={!editing} value={cep} onBlur={(event) => lookupCep(event.target.value)} onChange={(event) => setCep(maskCep(event.target.value))} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold md:col-span-2">Endereco<input name="street" required disabled={!editing} value={street} onChange={(event) => setStreet(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Numero<input name="addressNumber" required disabled={!editing} value={addressNumber} onChange={(event) => setAddressNumber(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Bairro<input name="neighborhood" required disabled={!editing} value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Cidade<input name="city" required disabled={!editing} value={city} onChange={(event) => setCity(event.target.value)} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Estado<input name="state" required maxLength={2} disabled={!editing} value={state} onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Responsavel<input name="contactName" required disabled={!editing} defaultValue={contact?.name ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Cargo do responsavel<input name="contactRole" required disabled={!editing} defaultValue={contact?.role_title ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Telefone do responsavel<input name="contactPhone" required disabled={!editing} value={contactPhone} onChange={(event) => setContactPhone(maskPhone(event.target.value))} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold md:col-span-2">Descricao<textarea name="description" disabled={!editing} defaultValue={company?.description ?? ""} className="field-input mt-2 min-h-28 disabled:bg-slate-100" /></label>
      </div>
      {statusMessage ? <p className="mt-4 text-sm text-slate-600">{statusMessage}</p> : null}
    </form>
  );
}
