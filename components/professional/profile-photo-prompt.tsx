"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const promptKeyPrefix = "portal-encaixe:profile-photo-prompt:";

function waitForCurrentAlertToClose(cancelled: () => boolean) {
  return new Promise<void>((resolve) => {
    function check() {
      if (cancelled() || !document.querySelector(".swal2-container")) {
        resolve();
        return;
      }
      window.setTimeout(check, 250);
    }
    check();
  });
}

export function ProfilePhotoPrompt({ userId }: { userId: string }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sessionKey = `${promptKeyPrefix}${userId}`;
    if (window.sessionStorage.getItem(sessionKey) === "shown") return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await waitForCurrentAlertToClose(() => cancelled);
      if (cancelled) return;

      window.sessionStorage.setItem(sessionKey, "shown");
      const result = await Swal.fire({
        icon: "info",
        title: "Adicionar uma foto de perfil",
        html: "Uma foto ajuda empresas e administradores a reconhecerem seu perfil durante a triagem. Você pode adicionar agora ou continuar e fazer isso depois.",
        confirmButtonText: "Ir Agora",
        cancelButtonText: "Depois",
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: "#F2811D",
        cancelButtonColor: "#0F2D4E",
        reverseButtons: true
      });

      if (result.isConfirmed) {
        router.push("/professional/profile#foto-perfil");
        window.setTimeout(() => document.getElementById("foto-perfil")?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router, userId]);

  return null;
}
