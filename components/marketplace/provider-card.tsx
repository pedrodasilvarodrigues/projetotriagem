import Link from "next/link";
import { MapPin, Star } from "lucide-react";

export type ProviderSummary = { provider_id: string; full_name: string; professional_title: string; service_description: string; specialties: string[]; service_mode: string; pricing_model: string; starting_price: number | null; rating_average: number; rating_count: number; city: string; state: string; category_names: string[] };

export function ProviderCard({ provider }: { provider: ProviderSummary }) {
  return <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#F2811D]">{provider.category_names?.[0] ?? "Prestador verificado"}</p><h2 className="mt-1 text-xl font-bold text-[#0F2D4E]">{provider.full_name}</h2><p className="text-sm font-semibold text-slate-600">{provider.professional_title}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Star size={14} fill="currentColor" />{Number(provider.rating_average).toFixed(1)}</span></div>
    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{provider.service_description}</p>
    <div className="mt-4 flex flex-wrap gap-2">{provider.specialties?.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0F2D4E]">{item}</span>)}</div>
    <div className="mt-auto flex items-end justify-between gap-3 pt-5"><div className="text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={14} />{provider.city}, {provider.state}</span><span>{provider.rating_count} avaliação(ões)</span></div><Link href={`/services/providers/${provider.provider_id}`} className="rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#F2811D]">Ver perfil</Link></div>
  </article>;
}
