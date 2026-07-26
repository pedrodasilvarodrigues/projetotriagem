"use client";

import { useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

export function ProviderSearchFilters({
  basePath,
  categories,
  values
}: {
  basePath: string;
  categories: Category[];
  values: { q?: string; category?: string; city?: string; mode?: string; rating?: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roots = categories.filter((category) => !category.parent_id);
  const children = categories.filter((category) => category.parent_id);
  const hasFilters = Boolean(values.q || values.category || values.city || values.mode || values.rating);

  function submitSoon() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  return (
    <div className="rounded-[24px] border border-[#D8E2EB] bg-white p-3 shadow-[0_12px_35px_rgba(15,45,78,0.07)]">
      <form ref={formRef} action={basePath} className="grid gap-2.5 lg:grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(150px,.8fr)_minmax(150px,.7fr)_auto]">
        <label className="relative">
          <span className="sr-only">Nome, serviço ou especialidade</span>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A899A]" size={18} />
          <input
            name="q"
            defaultValue={values.q}
            onInput={submitSoon}
            className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
            placeholder="Nome, serviço ou especialidade"
          />
        </label>

        <label>
          <span className="sr-only">Categoria ou subcategoria</span>
          <select
            name="category"
            defaultValue={values.category ?? ""}
            onChange={() => formRef.current?.requestSubmit()}
            className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white px-3 text-sm text-[#405168] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
          >
            <option value="">Todas as categorias</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.id}>{root.name}</option>
                {children.filter((child) => child.parent_id === root.id).map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Cidade</span>
          <input
            name="city"
            defaultValue={values.city}
            onInput={submitSoon}
            className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white px-4 text-sm text-[#172033] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
            placeholder="Cidade"
          />
        </label>

        <label>
          <span className="sr-only">Modalidade</span>
          <select
            name="mode"
            defaultValue={values.mode ?? ""}
            onChange={() => formRef.current?.requestSubmit()}
            className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white px-3 text-sm text-[#405168] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
          >
            <option value="">Toda modalidade</option>
            <option value="in_person">Presencial</option>
            <option value="remote">Remoto</option>
            <option value="both">Presencial e remoto</option>
          </select>
        </label>

        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F2811D] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(242,129,29,0.24)] transition hover:-translate-y-0.5 hover:bg-[#DD7010] active:translate-y-0">
          <SlidersHorizontal size={17} />Buscar
        </button>
      </form>

      {hasFilters ? (
        <div className="mt-2 flex justify-end">
          <Link href={basePath} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#607085] transition hover:bg-[#E8EFF5] hover:text-[#0F2D4E]">
            <X size={14} />Limpar filtros
          </Link>
        </div>
      ) : null}
    </div>
  );
}
