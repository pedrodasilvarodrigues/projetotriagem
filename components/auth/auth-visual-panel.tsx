"use client";

import { BadgeCheck, Building2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PortalEncaixeLogo } from "@/components/app/logo";

const statistics = [
  { value: 1500, label: "Perfis acompanhados" },
  { value: 120, label: "Empresas ativas" },
  { value: 850, label: "Encaminhamentos" }
];

function AnimatedNumber({ value }: { value: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / 1250, 1);
      setCurrent(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{`+${current}`}</>;
}

export function AuthVisualPanel({ mode }: { mode: "login" | "register" }) {
  return (
    <section className="auth-story" aria-label="Portal Encaixe: processo profissional seguro">
      <div className="auth-story__art" aria-hidden="true" />
      <div className="auth-story__breath" aria-hidden="true" />
      <svg className="auth-story__trail" viewBox="0 0 900 520" aria-hidden="true">
        <path d="M515 72 C705 96 690 205 592 228 S500 374 735 405" />
      </svg>
      <i className="auth-story__float auth-story__float--one" aria-hidden="true" />
      <i className="auth-story__float auth-story__float--two" aria-hidden="true" />
      <i className="auth-story__float auth-story__float--three" aria-hidden="true" />

      <div className="auth-story__content">
        <PortalEncaixeLogo lightText />
        <div className="auth-story__copy">
          <p className="auth-story__eyebrow"><BadgeCheck size={14} /> Acompanhamento profissional e privado</p>
          <h1>{mode === "login" ? "Entre para acompanhar processos com clareza." : "Comece uma jornada profissional mais clara."}</h1>
          <p>{mode === "login" ? "Acesse oportunidades, triagens e próximos passos em um só ambiente seguro." : "Crie seu perfil e conecte experiência, oportunidades e empresas em um fluxo organizado."}</p>
          <div className="auth-story__stats">
            {statistics.map((item) => <div key={item.label}><strong><AnimatedNumber value={item.value} /></strong><span>{item.label}</span></div>)}
          </div>
        </div>
        <div className="auth-story__badges">
          <span><ShieldCheck size={15} /> LGPD</span>
          <span><UserRoundCheck size={15} /> Perfil validado</span>
          <span><Building2 size={15} /> Empresas cadastradas</span>
        </div>
      </div>
    </section>
  );
}
