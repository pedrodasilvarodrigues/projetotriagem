import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { ServicePostGallery } from "@/components/marketplace/service-post-gallery";
import { startConversationAction } from "@/lib/actions/marketplace";
import { getCurrentRole } from "@/lib/auth/access";
import { isMarketplaceEnabled } from "@/lib/features";
import { createServicePostSignedUrlMap, type ServicePostDetail } from "@/lib/marketplace/explore";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ServicePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getCurrentRole();
  if (role !== "client" && role !== "professional") redirect("/acesso-negado");
  if (!await isMarketplaceEnabled()) redirect(role === "client" ? "/client" : "/professional/profile");

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("get_service_post_detail", { target_post_id: id });
  if (error || !data?.length) notFound();
  const rawPost = data[0] as ServicePostDetail;
  const signedUrls = await createServicePostSignedUrlMap(supabase, rawPost.images);
  const post = { ...rawPost, images: rawPost.images.map((path) => signedUrls.get(path)).filter((url): url is string => Boolean(url)) };
  if (!post.images.length) notFound();
  const returnPath = role === "client" ? "/client" : "/professional";

  return (
    <AppShell eyebrow={role === "client" ? "Cliente" : "Profissional"} title="Detalhes do trabalho">
      <Link href={returnPath} className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[#607085] transition hover:bg-[#E8EFF5] hover:text-[#0F2D4E]">
        <ArrowLeft size={17} />Voltar para Explorar
      </Link>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
        <ServicePostGallery images={post.images} providerName={post.full_name} />
        <aside className="self-start rounded-[30px] border border-[#D8E2EB] bg-[#F9FBFC] p-6 shadow-[0_20px_55px_rgba(15,45,78,0.09)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F2811D]">{post.category_names.slice(0, 2).join(" · ") || post.professional_title}</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0F2D4E]">{post.full_name}</h2>
          <p className="mt-1 font-semibold text-[#607085]">{post.professional_title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-[#A85508]"><Star size={17} fill="currentColor" />{Number(post.rating_average).toFixed(1)}</span>
            <span className="text-[#6F7E90]">{post.rating_count} {post.rating_count === 1 ? "avaliação" : "avaliações"}</span>
          </div>
          <div className="my-6 h-px bg-[#DCE5ED]" />
          <h1 className="text-xl font-bold text-[#0F2D4E]">Sobre este trabalho</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#405168]">{post.description}</p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#7A899A]">
            <CalendarDays size={15} />Publicado em {new Date(post.created_at).toLocaleDateString("pt-BR")}
          </p>
          <form action={startConversationAction} className="mt-7">
            <input type="hidden" name="providerId" value={post.provider_id} />
            <input type="hidden" name="returnTo" value={`/services/posts/${id}`} />
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F2811D] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_25px_rgba(242,129,29,0.26)] transition hover:-translate-y-0.5 hover:bg-[#DD7010] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/25">
              <MessageSquare size={18} />Conversar com o prestador
            </button>
          </form>
          <Link href={`/services/providers/${post.provider_id}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#CAD6E2] bg-white px-5 py-3 text-sm font-bold text-[#0F2D4E] transition hover:border-[#F2811D]">
            Ver perfil completo
          </Link>
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#E8EFF5] p-3 text-xs leading-5 text-[#506176]">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#0F2D4E]" size={16} />O contato permanece protegido dentro do chat do Portal Encaixe.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
