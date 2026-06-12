"use client";

import { useState } from "react";

type CompanyProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  company: {
    legal_name?: string | null;
    trade_name?: string | null;
    cnpj?: string | null;
    corporate_email?: string | null;
    phone?: string | null;
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

export function CompanyProfileForm({ action, company, contact }: CompanyProfileFormProps) {
  const [editing, setEditing] = useState(false);

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
        <label className="text-sm font-semibold">CNPJ<input name="cnpj" required disabled={!editing} defaultValue={company?.cnpj ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Razao social<input name="legalName" required disabled={!editing} defaultValue={company?.legal_name ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Nome fantasia<input name="tradeName" required disabled={!editing} defaultValue={company?.trade_name ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Email corporativo<input name="corporateEmail" required type="email" disabled={!editing} defaultValue={company?.corporate_email ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Telefone<input name="phone" required disabled={!editing} defaultValue={company?.phone ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Segmento<input name="segment" required disabled={!editing} defaultValue={company?.segment ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Cidade<input name="city" required disabled={!editing} defaultValue={company?.city ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Estado<input name="state" required maxLength={2} disabled={!editing} defaultValue={company?.state ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Responsavel<input name="contactName" required disabled={!editing} defaultValue={contact?.name ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Cargo do responsavel<input name="contactRole" required disabled={!editing} defaultValue={contact?.role_title ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold">Telefone do responsavel<input name="contactPhone" required disabled={!editing} defaultValue={contact?.phone ?? ""} className="field-input mt-2 disabled:bg-slate-100" /></label>
        <label className="text-sm font-semibold md:col-span-2">Descricao<textarea name="description" disabled={!editing} defaultValue={company?.description ?? ""} className="field-input mt-2 min-h-28 disabled:bg-slate-100" /></label>
      </div>
    </form>
  );
}
