"use client";

import { useState } from "react";
import { registerClientWithEmailAction } from "@/lib/actions/auth";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-orange-100";

export function ClientRegisterForm({ error }: { error?: string }) {
  const [submitting, setSubmitting] = useState(false);
  return <form action={registerClientWithEmailAction} onSubmit={() => setSubmitting(true)} className="space-y-5">
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {error.replaceAll("-", " ")}.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Nome completo<input className={inputClass} name="fullName" required minLength={3} /></label>
      <label className="text-sm font-semibold text-slate-700">Telefone<input className={inputClass} name="phone" required placeholder="(24) 99999-9999" /></label>
      <label className="text-sm font-semibold text-slate-700">Cidade<input className={inputClass} name="city" required /></label>
      <label className="text-sm font-semibold text-slate-700">UF<input className={inputClass} name="state" required minLength={2} maxLength={2} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">E-mail<input className={inputClass} name="email" type="email" required /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Senha<input className={inputClass} name="password" type="password" required minLength={6} /></label>
    </div>
    <label className="flex gap-3 text-sm text-slate-600"><input name="terms" type="checkbox" required />Aceito os Termos de Uso.</label>
    <label className="flex gap-3 text-sm text-slate-600"><input name="privacy" type="checkbox" required />Li e aceito a Política de Privacidade.</label>
    <button disabled={submitting} className="w-full rounded-xl bg-[#F2811D] px-5 py-3.5 font-bold text-white transition hover:bg-[#dd7010] disabled:opacity-60">{submitting ? "Criando conta..." : "Criar conta de cliente"}</button>
  </form>;
}
