"use client";

import { BellRing, Check, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type PermissionState = NotificationPermission | "unsupported";

function isAppleMobileWithoutPwa() {
  const userAgent = window.navigator.userAgent;
  const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isAppleMobile && !standalone;
}

function base64UrlToUint8Array(value: string) {
  const normalized = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [dismissed, setDismissed] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const isReady = useMemo(() => Boolean(publicKey && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext), [publicKey]);

  useEffect(() => {
    if (!isReady) return;
    setPermission(Notification.permission);
    setDismissed(window.sessionStorage.getItem("portal-encaixe-push-prompt-dismissed") === "1");
  }, [isReady]);

  const registerSubscription = useCallback(async () => {
    if (!publicKey) throw new Error("Configuração de notificações indisponível.");
    const registration = await navigator.serviceWorker.register("/push-service-worker.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey)
    });

    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON())
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível ativar as notificações neste dispositivo.");
  }, [publicKey]);

  const enableNotifications = useCallback(async () => {
    if (!isReady) return;
    if (isAppleMobileWithoutPwa()) {
      setMessage("No iPhone, adicione o Portal Encaixe à Tela de Início e abra-o como app para ativar notificações.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const granted = await Notification.requestPermission();
      setPermission(granted);
      if (granted !== "granted") {
        setMessage("As notificações não foram autorizadas. Você pode ativá-las nas configurações do navegador quando quiser.");
        return;
      }
      await registerSubscription();
      const test = await fetch("/api/push/test", { method: "POST" });
      if (!test.ok) {
        const payload = await test.json().catch(() => ({}));
        setMessage(payload.error || "Notificações ativadas. O aviso de teste pode levar alguns instantes.");
      } else {
        setMessage("Notificações ativadas neste dispositivo. Enviamos um aviso de teste.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ativar as notificações neste dispositivo.");
    } finally {
      setBusy(false);
    }
  }, [isReady, registerSubscription]);

  const dismiss = useCallback(() => {
    window.sessionStorage.setItem("portal-encaixe-push-prompt-dismissed", "1");
    setDismissed(true);
  }, []);

  if (!isReady || dismissed || permission === "granted") return null;

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-orange-200 bg-white p-4 shadow-xl shadow-slate-900/15" aria-live="polite">
      <button type="button" onClick={dismiss} aria-label="Fechar aviso de notificações" className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={16} /></button>
      <div className="flex gap-3 pr-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-[#F2811D]"><BellRing size={20} /></span>
        <div>
          <h2 className="font-display text-base font-bold text-[#0F2D4E]">Ative os avisos importantes</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">Receba atualizações de processos, mensagens e serviços mesmo com o portal fechado.</p>
        </div>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{message}</p> : null}
      <button type="button" onClick={enableNotifications} disabled={busy} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173e68] disabled:cursor-wait disabled:opacity-70">
        {permission === "denied" ? <Smartphone size={17} /> : <Check size={17} />}
        {busy ? "Ativando…" : permission === "denied" ? "Ver como ativar" : "Ativar notificações"}
      </button>
    </aside>
  );
}
