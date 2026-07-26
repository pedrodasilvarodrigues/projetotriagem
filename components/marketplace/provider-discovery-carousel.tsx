"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { ProviderCard, type ProviderSummary } from "@/components/marketplace/provider-card";

export function ProviderDiscoveryCarousel({
  providers,
  allProvidersHref,
  profileBasePath
}: {
  providers: ProviderSummary[];
  allProvidersHref: string;
  profileBasePath: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 300), behavior: "smooth" });
  }

  if (!providers.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-[#BFCEDB] bg-white px-6 py-12 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FFF1E5] text-[#F2811D]"><Store size={27} /></span>
        <h2 className="mt-4 text-xl font-bold text-[#0F2D4E]">Novos prestadores aparecerão aqui</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#607085]">Assim que um perfil for aprovado, ele entra automaticamente nesta vitrine.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#D7E1EA] bg-white py-6 shadow-[0_18px_55px_rgba(15,45,78,0.09)] sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F2811D]">Prestadores em destaque</p>
          <h2 className="mt-1 text-2xl font-bold text-[#0F2D4E]">Encontre quem pode ajudar você</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="hidden size-10 items-center justify-center rounded-xl border border-[#CAD6E2] bg-white text-[#0F2D4E] transition hover:border-[#F2811D] hover:text-[#F2811D] sm:inline-flex" aria-label="Prestadores anteriores">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => move(1)} className="hidden size-10 items-center justify-center rounded-xl border border-[#CAD6E2] bg-white text-[#0F2D4E] transition hover:border-[#F2811D] hover:text-[#F2811D] sm:inline-flex" aria-label="Próximos prestadores">
            <ChevronRight size={20} />
          </button>
          <Link href={allProvidersHref} className="rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173F69]">
            Ver todos
          </Link>
        </div>
      </div>

      <div
        ref={trackRef}
        className="scrollbar-thin mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:px-7"
        aria-label="Carrossel de prestadores"
      >
        {providers.map((provider) => (
          <div key={provider.provider_id} className="w-[86vw] max-w-[350px] shrink-0 snap-start sm:w-[330px]">
            <ProviderCard provider={provider} profileBasePath={profileBasePath} />
          </div>
        ))}
      </div>
    </section>
  );
}
