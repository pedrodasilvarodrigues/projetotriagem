import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ClipboardPlus, Flag } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { ChatPanel } from "@/components/marketplace/chat-panel";
import { ServiceReviewForm } from "@/components/marketplace/service-review-form";
import { confirmServiceCompletionAction, createServiceRequestAction, reportMarketplaceAction, transitionServiceRequestAction } from "@/lib/actions/marketplace";
import { getCurrentRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";
const input = "mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#F2811D]";
const labels: Record<string,string> = { awaiting_response: "Aguardando resposta", accepted: "Aceita", rejected: "Recusada", in_progress: "Em andamento", completed: "Concluída", cancelled: "Cancelada", disputed: "Em disputa", sent: "Enviada" };
const errorMessages: Record<string, string> = {
  invalid_rating: "Selecione uma nota de 1 a 5 estrelas.",
  review_comment_too_long: "O comentário deve ter no máximo 2.000 caracteres.",
  requester_conversation_required: "Somente quem iniciou esta conversa pode avaliar o prestador.",
  review_already_submitted: "Você já avaliou o prestador nesta conversa."
};

export default async function MarketplaceConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const role = await getCurrentRole();
  const eyebrow = role === "client" ? "Cliente" : role === "admin" ? "Administrador" : "Profissional";
  const supabase = await createServerClient();
  if (!await isMarketplaceEnabled()) redirect(role === "admin" ? "/admin/settings" : role === "professional" ? "/professional/profile" : "/");
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: conversation }, { data: messages }, { data: requests }] = await Promise.all([
    supabase.from("marketplace_conversations").select("id,status,provider_id,client_id,requester_user_id").eq("id", id).maybeSingle(),
    supabase.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", id).is("deleted_at", null).order("created_at"),
    supabase.from("service_requests").select("*").eq("conversation_id", id).order("created_at", { ascending: false })
  ]);
  if (!conversation || !userData.user) notFound();
  await supabase.rpc("mark_marketplace_conversation_read", { target_conversation_id: id });
  const { data: professional } = role === "professional" ? await supabase.from("professionals").select("id").eq("user_id", userData.user.id).maybeSingle() : { data: null };
  const { data: provider } = professional ? await supabase.from("service_provider_profiles").select("id").eq("professional_id", professional.id).maybeSingle() : { data: null };
  const isProvider = provider?.id === conversation.provider_id;
  const isRequester = conversation.requester_user_id === userData.user.id;
  const { data: ownReviews } = await supabase.from("service_reviews").select("id").eq("conversation_id", id).eq("evaluator_user_id", userData.user.id).limit(1);
  const alreadyReviewed = Boolean(ownReviews?.length);

  return <AppShell eyebrow={eyebrow} title="Negociação de serviço">
    {query.error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessages[decodeURIComponent(query.error)] ?? decodeURIComponent(query.error)}</p>}
    {query.success && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{query.success === "avaliacao-publicada" ? "Avaliação publicada com sucesso." : "Operação concluída."}</p>}
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <ChatPanel conversationId={id} currentUserId={userData.user.id} initialMessages={messages ?? []} />
      <aside className="space-y-5">
        {role === "client" && isRequester && conversation.status === "open" ? <details className="rounded-2xl border border-slate-200 bg-white p-5" open={!requests?.length}><summary className="flex cursor-pointer items-center gap-2 font-bold text-[#0F2D4E]"><ClipboardPlus size={19} />Criar solicitação formal</summary><form action={createServiceRequestAction} className="mt-4 space-y-3"><input type="hidden" name="conversationId" value={id} /><label className="text-sm font-semibold">Serviço<input name="title" required minLength={3} className={input} /></label><label className="text-sm font-semibold">Descrição<textarea name="description" required minLength={10} rows={3} className={input} /></label><label className="text-sm font-semibold">Forma de preço<select name="pricingModel" className={input}><option value="quote">Orçamento</option><option value="negotiable">A combinar</option><option value="fixed">Valor fixo</option><option value="hourly">Por hora</option></select></label><label className="text-sm font-semibold">Valor proposto opcional<input name="amount" type="number" min="0" step="0.01" className={input} /></label><button className="w-full rounded-xl bg-[#F2811D] px-4 py-3 text-sm font-bold text-white">Enviar solicitação</button></form></details> : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-[#0F2D4E]">Solicitações</h2><div className="mt-4 space-y-4">{requests?.length ? requests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-2"><strong className="text-sm text-[#0F2D4E]">{request.title}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-[#0F2D4E]">{labels[request.status] ?? request.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{request.description}</p>{request.proposed_amount && <p className="mt-2 text-sm font-bold">R$ {Number(request.proposed_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}<div className="mt-3 flex flex-wrap gap-2">{isProvider && request.status === "awaiting_response" ? <><MiniAction requestId={request.id} conversationId={id} status="accepted" label="Aceitar" /><MiniAction requestId={request.id} conversationId={id} status="rejected" label="Recusar" danger /></> : null}{isProvider && request.status === "accepted" ? <MiniAction requestId={request.id} conversationId={id} status="in_progress" label="Iniciar serviço" /> : null}{["accepted","in_progress"].includes(request.status) ? <form action={confirmServiceCompletionAction}><input type="hidden" name="conversationId" value={id} /><input type="hidden" name="requestId" value={request.id} /><button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Confirmar conclusão</button></form> : null}{!["completed","cancelled","rejected"].includes(request.status) ? <MiniAction requestId={request.id} conversationId={id} status="cancelled" label="Cancelar" danger /> : null}</div></article>) : <p className="text-sm text-slate-500">Nenhuma solicitação formal. O chat continua disponível para negociação direta.</p>}</div></section>

        {isRequester && !alreadyReviewed ? <section className="rounded-2xl border border-amber-200 bg-white p-5"><h2 className="font-bold text-[#0F2D4E]">Avaliar prestador</h2><p className="mt-1 text-xs leading-5 text-slate-500">Disponível após a conversa ser criada. A nota é obrigatória e o comentário é opcional.</p><ServiceReviewForm conversationId={id} /></section> : null}

        <details className="rounded-2xl border border-red-100 bg-white p-5"><summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-red-700"><Flag size={17} />Denunciar conversa</summary><form action={reportMarketplaceAction} className="mt-4 space-y-3"><input type="hidden" name="conversationId" value={id} /><input type="hidden" name="providerId" value={conversation.provider_id} /><input type="hidden" name="reportType" value="conversation" /><input name="reason" required className={input} placeholder="Motivo" /><textarea name="description" className={input} placeholder="Detalhes para a moderação" /><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white"><AlertTriangle size={17} />Enviar denúncia</button></form></details>
      </aside>
    </div>
  </AppShell>;
}

function MiniAction({ requestId, conversationId, status, label, danger }: { requestId: string; conversationId: string; status: string; label: string; danger?: boolean }) {
  return <form action={transitionServiceRequestAction}><input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="status" value={status} /><button className={`rounded-lg px-3 py-2 text-xs font-bold text-white ${danger ? "bg-red-700" : "bg-[#0F2D4E]"}`}>{label}</button></form>;
}
