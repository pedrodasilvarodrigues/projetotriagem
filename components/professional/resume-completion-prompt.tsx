"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { acknowledgeResumePromptAction } from "@/lib/actions/onboarding";

export function ResumeCompletionPrompt() {
  const shown = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    void Swal.fire({
      icon: "info",
      title: "Um currículo completo aumenta suas chances",
      html: "Empresas e administradores usam suas experiências, formação e habilidades para identificar vagas compatíveis. Você pode preencher agora ou continuar depois.",
      confirmButtonText: "Ir preencher",
      cancelButtonText: "Depois",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: "#F2811D",
      cancelButtonColor: "#0F2D4E",
      reverseButtons: true
    }).then(async (result) => {
      const answer = result.isConfirmed ? "fill" : "later";
      await acknowledgeResumePromptAction(answer);
      router.replace("/professional/resume", { scroll: false });
      if (result.isConfirmed) {
        window.setTimeout(() => document.getElementById("objetivo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    });
  }, [router]);

  return null;
}
