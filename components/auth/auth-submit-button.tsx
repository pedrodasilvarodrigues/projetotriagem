"use client";

import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { LoadingGear } from "@/components/app/loading-gear";

export function AuthSubmitButton({ children, disabled = false }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary auth-primary-button w-full py-3.5" type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? <LoadingGear compact label="Processando acesso" /> : null}
      {pending ? "Processando..." : children}
      {!pending ? <ArrowRight aria-hidden="true" size={17} /> : null}
    </button>
  );
}
