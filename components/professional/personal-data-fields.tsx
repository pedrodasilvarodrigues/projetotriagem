"use client";

import { useState } from "react";
import { BirthDateInput } from "@/components/auth/birth-date-input";

type PersonalData = {
  cpf?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  cep?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

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
  return digits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  const raw = digits(value).slice(0, 11);
  if (raw.length <= 10) return raw.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return raw.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function maskCep(value: string) {
  return digits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export function PersonalDataFields({ initial, identityRequired = false }: { initial: PersonalData; identityRequired?: boolean }) {
  const [cpf, setCpf] = useState(() => maskCpf(initial.cpf ?? ""));
  const [phone, setPhone] = useState(() => maskPhone(initial.phone ?? ""));
  const [cep, setCep] = useState(() => maskCep(initial.cep ?? ""));
  const [street, setStreet] = useState(initial.street ?? "");
  const [addressNumber, setAddressNumber] = useState(initial.addressNumber ?? "");
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [state, setState] = useState((initial.state ?? "").toUpperCase().slice(0, 2));
  const [cepStatus, setCepStatus] = useState("");

  async function lookupCep(value: string) {
    const rawCep = digits(value);
    if (rawCep.length !== 8) {
      setCepStatus(rawCep ? "Informe os 8 digitos do CEP." : "");
      return;
    }

    setCepStatus("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      if (!response.ok) throw new Error("cep-request-failed");
      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        setCepStatus("CEP nao encontrado. Preencha o endereco manualmente.");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState((data.uf ?? "").toUpperCase().slice(0, 2));
      setCepStatus("Endereco preenchido automaticamente.");
    } catch {
      setCepStatus("Nao foi possivel consultar o CEP. Preencha manualmente.");
    }
  }

  return (
    <>
      <label className="text-sm font-semibold">
        CPF
        <input name="cpf" required={identityRequired} inputMode="numeric" autoComplete="off" maxLength={14} value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} className="field-input mt-2" placeholder="000.000.000-00" />
      </label>
      <label className="text-sm font-semibold">
        Data de nascimento
        <BirthDateInput initialValue={initial.birthDate} required={identityRequired} className="field-input mt-2" />
      </label>
      <label className="text-sm font-semibold">
        Telefone
        <input name="phone" required inputMode="tel" autoComplete="tel" maxLength={15} value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className="field-input mt-2" placeholder="(00) 00000-0000" />
      </label>
      <label className="text-sm font-semibold">
        CEP
        <input name="cep" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={cep} onBlur={(event) => lookupCep(event.target.value)} onChange={(event) => setCep(maskCep(event.target.value))} className="field-input mt-2" placeholder="00000-000" />
      </label>
      {cepStatus ? <p className="text-sm text-slate-600 md:col-span-2" aria-live="polite">{cepStatus}</p> : null}
      <label className="text-sm font-semibold md:col-span-2">
        Endereco
        <input name="street" value={street} onChange={(event) => setStreet(event.target.value)} autoComplete="address-line1" className="field-input mt-2" />
      </label>
      <label className="text-sm font-semibold">
        Numero
        <input name="addressNumber" value={addressNumber} onChange={(event) => setAddressNumber(event.target.value)} autoComplete="address-line2" className="field-input mt-2" />
      </label>
      <label className="text-sm font-semibold">
        Bairro
        <input name="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="field-input mt-2" />
      </label>
      <label className="text-sm font-semibold">
        Cidade
        <input name="city" required value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className="field-input mt-2" />
      </label>
      <label className="text-sm font-semibold">
        Estado
        <input name="state" required maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} autoComplete="address-level1" className="field-input mt-2" />
      </label>
    </>
  );
}
