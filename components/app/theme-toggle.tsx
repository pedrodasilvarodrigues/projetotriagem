"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="size-10 rounded-xl border border-white/10 bg-white/5 animate-pulse shrink-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-10 shrink-0 items-center justify-center border border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl transition cursor-pointer"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? (
        <Sun size={18} className="text-orange-400 shrink-0" />
      ) : (
        <Moon size={18} className="text-blue-300 shrink-0" />
      )}
    </button>
  );
}
