"use client";

import { Cog, Handshake } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

const INTRO_SESSION_KEY = "portal-encaixe:intro-cinematica:v1";
const FULL_INTRO_DURATION_MS = 5000;
const REDUCED_INTRO_DURATION_MS = 1400;

type IntroMode = "hidden" | "full" | "reduced";

export function CinematicIntro() {
  const [mode, setMode] = useState<IntroMode>("hidden");
  const [lettersVisible, setLettersVisible] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useLayoutEffect(() => {
    try {
      if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return;
    } catch {
      // Se o armazenamento estiver indisponível, a intro continua funcional.
    }

    setMode(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full");
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (mode === "hidden") return;

    const finish = () => {
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
      } catch {
        // A ausência de armazenamento não deve impedir o acesso à home.
      }
      document.documentElement.style.overflow = "";
      setMode("hidden");
    };

    if (mode === "reduced") {
      setShowLogo(true);
      setLettersVisible(true);
      const fadeTimer = window.setTimeout(() => setFadeOut(true), 900);
      const finishTimer = window.setTimeout(finish, REDUCED_INTRO_DURATION_MS);
      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(finishTimer);
      };
    }

    const flashTimer = window.setTimeout(() => setShowFlash(true), 2750);
    const logoTimer = window.setTimeout(() => setShowLogo(true), 2750);
    const textTimer = window.setTimeout(() => setLettersVisible(true), 3300);
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 4500);
    const finishTimer = window.setTimeout(finish, FULL_INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(logoTimer);
      window.clearTimeout(textTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [mode]);

  if (mode === "hidden") return null;

  if (mode === "reduced") {
    return (
      <div className={`cinematic-intro cinematic-intro--reduced ${fadeOut ? "cinematic-intro--out" : ""}`} aria-label="Portal Encaixe" role="status">
        <div className="cinematic-intro__static">
          <OfficialLogoMark animated={false} />
          <h1>PORTAL ENCAIXE</h1>
          <p>Conectando você ao profissional certo</p>
        </div>
      </div>
    );
  }

  const title = "PORTAL ENCAIXE";

  return (
    <div className={`cinematic-intro ${fadeOut ? "cinematic-intro--out" : ""}`} role="dialog" aria-modal="true" aria-label="Introdução cinematográfica do Portal Encaixe">
      <div className="cinematic-intro__atmosphere" aria-hidden="true" />
      <div className="cinematic-intro__grain grain-overlay" aria-hidden="true" />

      <div className="cinematic-intro__stage">
        <div className="cinematic-intro__encounter" aria-hidden="true">
          <svg className="cinematic-intro__search-path" viewBox="0 0 440 180">
            <path d="M 34 92 C 96 18, 162 160, 220 91 S 344 25, 406 90" />
          </svg>
          <span className="cinematic-intro__seeker" />
          <span className="cinematic-intro__shape cinematic-intro__shape--professional"><span /></span>
          <span className="cinematic-intro__shape cinematic-intro__shape--company"><span /></span>
          {showFlash ? <span className="cinematic-intro__flash" /> : null}
          {showLogo ? <OfficialLogoMark animated /> : null}
        </div>

        <div className="cinematic-intro__words">
          <h1 aria-label={title}>
            {title.split("").map((character, index) => (
              <span
                key={`${character}-${index}`}
                className={lettersVisible ? "is-visible" : ""}
                style={{ transitionDelay: `${index * 42}ms`, marginRight: character === " " ? "0.5rem" : undefined }}
                aria-hidden="true"
              >
                {character === " " ? "\u00a0" : character}
              </span>
            ))}
          </h1>
          <p>Conectando você ao profissional certo</p>
        </div>
      </div>
    </div>
  );
}

function OfficialLogoMark({ animated }: { animated: boolean }) {
  return (
    <div className={`cinematic-intro__logo ${animated ? "cinematic-intro__logo--animated" : ""}`} aria-hidden="true">
      <Cog className="cinematic-intro__gear" />
      <Handshake className="cinematic-intro__handshake" />
    </div>
  );
}
