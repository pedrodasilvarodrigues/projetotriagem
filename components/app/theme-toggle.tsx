"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Moon, Sun } from "lucide-react";
import { useUserPreferences } from "@/components/app/user-preferences-provider";

export function ThemeToggle({ variant = "dark", showLabel = false }: { variant?: "light" | "dark"; showLabel?: boolean }) {
  const { saveState, updatePreference } = useUserPreferences();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    setMounted(true);
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = async () => {
    await updatePreference("tema", isDark ? "claro" : "escuro");
  };

  if (!mounted) {
    return (
      <div className={`${showLabel ? "h-11 w-full" : "size-10"} shrink-0 animate-pulse rounded-xl border ${variant === "light" ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5"}`} />
    );
  }

  const label = isDark ? "Usar tema claro" : "Ativar modo noturno";

  return (
    <button
      type="button"
      onClick={() => void toggleTheme()}
      disabled={saveState === "saving"}
      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border transition cursor-pointer disabled:cursor-wait disabled:opacity-70 ${showLabel ? "w-full px-4 py-2.5 text-sm font-bold" : "size-10"} ${variant === "light" ? "border-slate-200 bg-white/90 text-[#0F2D4E] shadow-sm hover:border-[#F2811D]/50 hover:text-[#F2811D] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" : "border-white/15 bg-white/5 text-white hover:bg-white/10"}`}
      aria-label={label}
      title={label}
    >
      {saveState === "saving" ? (
        <LoaderCircle aria-hidden="true" size={18} className="animate-spin shrink-0" />
      ) : isDark ? (
        <Sun size={18} className="text-orange-400 shrink-0" />
      ) : (
        <Moon size={18} className={`${variant === "light" ? "text-[#0F2D4E] dark:text-blue-300" : "text-blue-300"} shrink-0`} />
      )}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
