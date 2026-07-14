"use client";

import Link from "next/link";
import { Handshake, Cog } from "lucide-react";

export function PortalEncaixeLogo({ showText = true, lightText = false }: { showText?: boolean; lightText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F2D4E] to-[#1B4E78] text-[#FAFBFC] shadow-md shadow-blue-900/15 overflow-hidden">
        {/* Animated gear/cog in background */}
        <Cog className="absolute size-9 text-[#F2811D]/35 animate-[spin_12s_linear_infinite]" />
        
        {/* Handshake in foreground */}
        <Handshake className="relative size-5 text-[#FAFBFC]" />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-display text-base font-bold tracking-tight ${lightText ? "text-white" : "text-[#0F2D4E] dark:text-white"} leading-none`}>
            Portal Encaixe
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#F2811D] mt-1 leading-none">
            Profissional Certo
          </span>
        </div>
      )}
    </div>
  );
}
