"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Images, MapPin, Star } from "lucide-react";
import { servicePostPublicUrl, type FeaturedProvider } from "@/lib/marketplace/explore";

export function ProviderPostCarousel({ provider, position }: { provider: FeaturedProvider; position: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(provider.posts.length > 1);

  function updateNavigation() {
    const track = trackRef.current;
    if (!track) return;
    setCanGoBack(track.scrollLeft > 8);
    setCanGoForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  }

  useEffect(() => {
    updateNavigation();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateNavigation);
    observer.observe(track);
    return () => observer.disconnect();
  }, [provider.posts.length]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-post-card]");
    track.scrollBy({ left: direction * ((card?.offsetWidth ?? 320) + 16), behavior: "smooth" });
  }

  const categories = provider.category_names.slice(0, 2).join(" · ") || provider.professional_title;

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#D9E3EC] bg-[#F9FBFC] shadow-[0_20px_65px_rgba(15,45,78,0.09)]">
      <div className="flex flex-col gap-4 border-b border-[#DCE5ED] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#0F2D4E] text-lg font-bold text-white shadow-[0_10px_24px_rgba(15,45,78,0.2)]">
            {provider.full_name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-[#0F2D4E] sm:text-xl">{provider.full_name}</h2>
              {position === 1 ? <span className="rounded-full bg-[#FFF0E2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C45E08]">Mais bem avaliado</span> : null}
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#607085]">{categories}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6F7E90]">
              <span className="inline-flex items-center gap-1 font-bold text-[#A85508]">
                <Star size={14} fill="currentColor" />
                {provider.rating_average.toFixed(1)}
              </span>
              <span>{provider.rating_count} {provider.rating_count === 1 ? "avaliação" : "avaliações"}</span>
              {provider.city ? <span className="inline-flex items-center gap-1"><MapPin size={13} />{provider.city}{provider.state ? `, ${provider.state}` : ""}</span> : null}
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={!canGoBack}
            aria-label={`Ver trabalhos anteriores de ${provider.full_name}`}
            className="grid size-10 place-items-center rounded-full border border-[#CAD6E2] bg-white text-[#0F2D4E] shadow-sm transition hover:-translate-x-0.5 hover:border-[#F2811D] hover:text-[#C45E08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/20 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={!canGoForward}
            aria-label={`Ver próximos trabalhos de ${provider.full_name}`}
            className="grid size-10 place-items-center rounded-full border border-[#CAD6E2] bg-white text-[#0F2D4E] shadow-sm transition hover:translate-x-0.5 hover:border-[#F2811D] hover:text-[#C45E08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/20 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateNavigation}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-5 scroll-smooth [scrollbar-width:none] sm:px-7 sm:py-6 [&::-webkit-scrollbar]:hidden"
        aria-label={`Trabalhos publicados por ${provider.full_name}`}
      >
        {provider.posts.map((post) => (
          <Link
            data-post-card
            key={post.id}
            href={`/services/posts/${post.id}`}
            className="group w-[82vw] max-w-[350px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-[#D8E2EB] bg-white shadow-[0_10px_28px_rgba(15,45,78,0.08)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#F2A45F] hover:shadow-[0_20px_38px_rgba(15,45,78,0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/25 sm:w-[310px] lg:w-[340px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#E8EFF5]">
              <img
                src={servicePostPublicUrl(post.images[0])}
                alt={`Trabalho publicado por ${provider.full_name}`}
                className="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
                loading="lazy"
              />
              {post.images.length > 1 ? (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0F2D4E]/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  <Images size={14} />{post.images.length}
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0F2D4E]/50 to-transparent opacity-70" />
            </div>
            <div className="p-4.5">
              <p className="line-clamp-3 text-sm leading-6 text-[#405168]">{post.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E6EDF3] pt-3">
                <span className="text-xs font-semibold text-[#7A899A]">{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="text-xs font-bold text-[#C45E08] transition group-hover:translate-x-0.5">Ver trabalho →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="px-5 pb-4 text-center text-[11px] font-semibold text-[#8291A3] sm:hidden">Arraste para o lado para ver mais trabalhos</p>
    </section>
  );
}
