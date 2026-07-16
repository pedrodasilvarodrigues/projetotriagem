"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { sendMarketplaceMessageAction } from "@/lib/actions/marketplace";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export function ChatPanel({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`marketplace:${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      const message = payload.new as Message;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-[#0F2D4E] px-5 py-4 text-white"><h2 className="font-bold">Conversa sobre o serviço</h2><p className="text-xs text-blue-100">Seus dados de contato permanecem protegidos.</p></div>
    <div className="flex max-h-[480px] min-h-72 flex-col gap-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">{messages.length === 0 && <p className="m-auto text-sm text-slate-500">Envie a primeira mensagem para começar a negociação.</p>}{messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.sender_id === currentUserId ? "ml-auto rounded-br-md bg-[#0F2D4E] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}><p className="whitespace-pre-wrap">{message.body}</p><time className={`mt-1 block text-[10px] ${message.sender_id === currentUserId ? "text-blue-200" : "text-slate-400"}`}>{new Date(message.created_at).toLocaleString("pt-BR")}</time></div>)}</div>
    <form action={sendMarketplaceMessageAction} className="flex gap-2 border-t border-slate-200 p-3"><input type="hidden" name="conversationId" value={conversationId} /><label className="sr-only" htmlFor="message-body">Mensagem</label><input id="message-body" name="body" required maxLength={4000} autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#F2811D] focus:ring-4 focus:ring-orange-100" placeholder="Escreva sua mensagem..." /><button className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F2811D] text-white hover:bg-[#dd7010]"><Send size={18} /><span className="sr-only">Enviar</span></button></form>
  </section>;
}
