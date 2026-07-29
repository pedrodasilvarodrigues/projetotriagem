"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type ThemePreference = "claro" | "escuro" | "automatico";
export type FontSizePreference = "pequeno" | "medio" | "grande";
export type DensityPreference = "compacta" | "confortavel";

export type UserPreferences = {
  tema: ThemePreference;
  tamanho_fonte: FontSizePreference;
  densidade: DensityPreference;
};

type SaveState = "idle" | "saving" | "saved" | "error";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  saveState: SaveState;
  updatePreference: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => Promise<void>;
};

const CACHE_KEY = "portal-encaixe:user-preferences:v1";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  tema: "automatico",
  tamanho_fonte: "medio",
  densidade: "confortavel"
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function isPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserPreferences>;
  return (
    ["claro", "escuro", "automatico"].includes(candidate.tema ?? "") &&
    ["pequeno", "medio", "grande"].includes(candidate.tamanho_fonte ?? "") &&
    ["compacta", "confortavel"].includes(candidate.densidade ?? "")
  );
}

function readCachedPreferences() {
  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    const parsed: unknown = cached ? JSON.parse(cached) : null;
    return isPreferences(parsed) ? parsed : DEFAULT_USER_PREFERENCES;
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

function resolveDarkTheme(theme: ThemePreference) {
  return theme === "escuro" || (theme === "automatico" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function applyUserPreferences(preferences: UserPreferences) {
  const root = document.documentElement;
  const dark = resolveDarkTheme(preferences.tema);

  root.dataset.theme = preferences.tema;
  root.dataset.fontSize = preferences.tamanho_fonte;
  root.dataset.density = preferences.densidade;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const preferencesRef = useRef(preferences);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const commitLocalPreferences = useCallback((next: UserPreferences) => {
    preferencesRef.current = next;
    setPreferences(next);
    applyUserPreferences(next);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    const cached = readCachedPreferences();
    commitLocalPreferences(cached);

    const supabase = createClient();
    let active = true;

    async function loadPreferences() {
      const { data: authData } = await supabase.auth.getUser();
      if (!active || !authData.user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("tema,tamanho_fonte,densidade")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.warn("[user-preferences] Não foi possível carregar as preferências.", error.message);
        return;
      }

      if (data && isPreferences(data)) {
        commitLocalPreferences(data);
        return;
      }

      const defaults = DEFAULT_USER_PREFERENCES;
      commitLocalPreferences(defaults);
      const { error: insertError } = await supabase.from("user_preferences").insert({
        user_id: authData.user.id,
        ...defaults
      });

      if (insertError && insertError.code !== "23505") {
        console.warn("[user-preferences] Não foi possível criar as preferências.", insertError.message);
      }
    }

    void loadPreferences();
    return () => {
      active = false;
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [commitLocalPreferences]);

  useEffect(() => {
    if (preferences.tema !== "automatico") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => applyUserPreferences(preferencesRef.current);
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [preferences.tema]);

  const updatePreference = useCallback(async <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => {
    const previous = preferencesRef.current;
    const next = { ...previous, [key]: value };
    commitLocalPreferences(next);
    setSaveState("saving");

    const saveOperation = saveQueueRef.current.then(async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (preferencesRef.current === next) commitLocalPreferences(previous);
        setSaveState("error");
        return;
      }

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: authData.user.id,
          ...next
        },
        { onConflict: "user_id" }
      );

      if (error) {
        if (preferencesRef.current === next) commitLocalPreferences(previous);
        setSaveState("error");
        return;
      }

      if (preferencesRef.current !== next) return;
      setSaveState("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1800);
    });

    saveQueueRef.current = saveOperation.catch(() => undefined);
    await saveOperation;
  }, [commitLocalPreferences]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, saveState, updatePreference }}>
      {children}
      <div
        aria-live="polite"
        className={`preference-toast ${saveState === "idle" ? "preference-toast--hidden" : ""} ${saveState === "error" ? "preference-toast--error" : ""}`}
      >
        {saveState === "saving" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : null}
        {saveState === "saved" ? <CheckCircle2 aria-hidden="true" size={17} /> : null}
        {saveState === "error" ? <TriangleAlert aria-hidden="true" size={17} /> : null}
        <span>
          {saveState === "saving" ? "Salvando preferência..." : saveState === "saved" ? "Preferência salva" : saveState === "error" ? "Não foi possível salvar. Tente novamente." : ""}
        </span>
      </div>
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  return context;
}
