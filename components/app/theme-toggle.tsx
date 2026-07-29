"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Moon, Sun } from "lucide-react";
import { useUserPreferences } from "@/components/app/user-preferences-provider";

export function ThemeToggle() {
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
      <div className="size-10 rounded-xl border border-white/10 bg-white/5 animate-pulse shrink-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggleTheme()}
      disabled={saveState === "saving"}
      className="inline-flex size-10 shrink-0 items-center justify-center border border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl transition cursor-pointer"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {saveState === "saving" ? (
        <LoaderCircle aria-hidden="true" size={18} className="animate-spin shrink-0" />
      ) : isDark ? (
        <Sun size={18} className="text-orange-400 shrink-0" />
      ) : (
        <Moon size={18} className="text-blue-300 shrink-0" />
      )}
    </button>
  );
}
