"use client";

import { motion } from "framer-motion";
import { Cog, Handshake } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

const INTRO_SESSION_KEY = "portal-encaixe:intro-cinematica:v2";
const FULL_INTRO_DURATION_MS = 11000;
const REDUCED_INTRO_DURATION_MS = 1800;
const TITLE = "PORTAL ENCAIXE";

const particles = [
  { left: "8%", top: "18%", size: 2, x: 18, y: -12, opacity: 0.2 },
  { left: "16%", top: "72%", size: 3, x: -12, y: -20, opacity: 0.26 },
  { left: "24%", top: "34%", size: 2, x: 22, y: 15, opacity: 0.18 },
  { left: "31%", top: "82%", size: 2, x: -16, y: -16, opacity: 0.22 },
  { left: "39%", top: "21%", size: 3, x: 10, y: 18, opacity: 0.2 },
  { left: "47%", top: "63%", size: 2, x: -20, y: 12, opacity: 0.24 },
  { left: "55%", top: "12%", size: 2, x: 14, y: 20, opacity: 0.18 },
  { left: "63%", top: "78%", size: 3, x: -15, y: -18, opacity: 0.23 },
  { left: "71%", top: "29%", size: 2, x: 18, y: -14, opacity: 0.2 },
  { left: "79%", top: "67%", size: 2, x: -10, y: 16, opacity: 0.24 },
  { left: "88%", top: "20%", size: 3, x: 12, y: 20, opacity: 0.19 },
  { left: "92%", top: "84%", size: 2, x: -16, y: -14, opacity: 0.22 },
  { left: "12%", top: "48%", size: 1, x: 24, y: 8, opacity: 0.2 },
  { left: "34%", top: "51%", size: 2, x: -14, y: 18, opacity: 0.17 },
  { left: "58%", top: "43%", size: 1, x: 20, y: -10, opacity: 0.2 },
  { left: "74%", top: "52%", size: 2, x: -18, y: 12, opacity: 0.18 },
  { left: "84%", top: "41%", size: 1, x: 14, y: -16, opacity: 0.23 },
  { left: "50%", top: "89%", size: 2, x: -12, y: -18, opacity: 0.18 }
] as const;

type IntroMode = "hidden" | "full" | "reduced";

export function CinematicIntro() {
  const [mode, setMode] = useState<IntroMode>("hidden");
  const [fadeOut, setFadeOut] = useState(false);

  useLayoutEffect(() => {
    try {
      if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return;
    } catch {
      // A intro permanece funcional quando o armazenamento não está disponível.
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reduced ? "reduced" : "full");
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
        // O acesso ao site nunca depende do sessionStorage.
      }

      document.documentElement.style.overflow = "";
      setMode("hidden");
    };

    const fadeTimer = mode === "full"
      ? window.setTimeout(() => setFadeOut(true), FULL_INTRO_DURATION_MS - 500)
      : undefined;
    const finishTimer = window.setTimeout(
      finish,
      mode === "reduced" ? REDUCED_INTRO_DURATION_MS : FULL_INTRO_DURATION_MS
    );

    return () => {
      if (fadeTimer) window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [mode]);

  if (mode === "hidden") return null;

  if (mode === "reduced") {
    return (
      <motion.div
        className="cinematic-intro cinematic-intro--reduced"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: REDUCED_INTRO_DURATION_MS / 1000, times: [0, 0.2, 0.76, 1], ease: "easeInOut" }}
        aria-label="Portal Encaixe"
        role="status"
      >
        <motion.div
          className="cinematic-intro__static"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <OfficialLogoMark />
          <h1>PORTAL ENCAIXE</h1>
          <p>Conectando você ao profissional certo</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`cinematic-intro ${fadeOut ? "cinematic-intro--out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Introdução cinematográfica do Portal Encaixe"
    >
      <motion.div
        className="cinematic-intro__atmosphere"
        aria-hidden="true"
        animate={{
          filter: [
            "saturate(0.22) brightness(0.68)",
            "saturate(0.22) brightness(0.72)",
            "saturate(0.48) brightness(0.82)",
            "saturate(0.72) brightness(0.9)",
            "saturate(1) brightness(1)"
          ],
          scale: [1, 1, 1.025, 1.045, 1.02]
        }}
        transition={{ duration: 7.5, times: [0, 0.2, 0.47, 0.8, 1], ease: "easeInOut" }}
      />

      <motion.div
        className="cinematic-intro__haze cinematic-intro__haze--blue"
        aria-hidden="true"
        animate={{ x: ["-4vw", "-1vw", "3vw"], y: ["2vh", "-2vh", "1vh"], opacity: [0.2, 0.38, 0.28] }}
        transition={{ duration: 9, times: [0, 0.5, 1], ease: "easeInOut" }}
      />
      <motion.div
        className="cinematic-intro__haze cinematic-intro__haze--orange"
        aria-hidden="true"
        animate={{ x: ["5vw", "1vw", "-3vw"], y: ["-3vh", "2vh", "0vh"], opacity: [0.02, 0.14, 0.26] }}
        transition={{ duration: 9, times: [0, 0.45, 1], ease: "easeInOut" }}
      />

      <div className="cinematic-intro__dust-field" aria-hidden="true">
        {particles.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            className="cinematic-intro__dust"
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
            animate={{
              x: [0, particle.x * 0.45, particle.x],
              y: [0, particle.y * 0.4, particle.y],
              opacity: [0.04, particle.opacity, particle.opacity * 0.72]
            }}
            transition={{ duration: 9, delay: index * 0.025, times: [0, 0.48, 1], ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="cinematic-intro__grain grain-overlay" aria-hidden="true" />

      <motion.div
        className="cinematic-intro__search-scene"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 1.46, duration: 2.12, times: [0, 0.06, 0.86, 1], ease: "easeInOut" }}
      >
        <motion.svg
          className="cinematic-intro__search-path"
          viewBox="0 0 720 300"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, duration: 2, ease: [0.2, 0.75, 0.25, 1] }}
        >
          <motion.path
            d="M 34 176 C 110 62, 188 250, 286 142 C 374 44, 454 220, 548 122 C 610 58, 650 116, 690 94"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 1, 0.28] }}
            transition={{ delay: 1.5, duration: 2, times: [0, 0.1, 0.82, 1], ease: [0.45, 0, 0.18, 1] }}
          />
        </motion.svg>
        <motion.span
          className="cinematic-intro__seeker"
          animate={{
            x: ["-20vw", "-9vw", "2vw", "13vw", "24vw", "33vw"],
            y: ["2vh", "-5vh", "4vh", "-3vh", "2vh", "-1vh"],
            opacity: [0, 1, 1, 1, 0.9, 0],
            scale: [0.45, 1, 0.82, 1.05, 0.74, 0.3]
          }}
          transition={{ delay: 1.5, duration: 2, times: [0, 0.16, 0.38, 0.62, 0.84, 1], ease: "easeInOut" }}
        />
      </motion.div>

      <div className="cinematic-intro__encounter" aria-hidden="true">
        <motion.div
          className="cinematic-intro__shape cinematic-intro__shape--professional"
          initial={{ x: "-48vw", y: 20, opacity: 0, scale: 0.62, rotate: -18 }}
          animate={{
            x: ["-48vw", "-34vw", "-13vw", "-3.4rem", "-1.1rem", 0],
            y: [20, -12, 10, -4, 0, 0],
            opacity: [0, 1, 1, 1, 1, 0],
            scale: [0.62, 0.8, 1, 1.12, 1.05, 0.25],
            rotate: [-18, -11, -4, 2, 0, 0]
          }}
          transition={{
            delay: 3.5,
            duration: 2.62,
            times: [0, 0.24, 0.62, 0.86, 0.955, 1],
            ease: ["easeOut", "easeIn", [0.15, 0.88, 0.22, 1], [0.18, 0.86, 0.2, 1], "easeIn"]
          }}
        >
          <span />
        </motion.div>
        <motion.div
          className="cinematic-intro__shape cinematic-intro__shape--company"
          initial={{ x: "48vw", y: -20, opacity: 0, scale: 0.62, rotate: 18 }}
          animate={{
            x: ["48vw", "34vw", "13vw", "3.4rem", "1.1rem", 0],
            y: [-20, 12, -10, 4, 0, 0],
            opacity: [0, 1, 1, 1, 1, 0],
            scale: [0.62, 0.8, 1, 1.12, 1.05, 0.25],
            rotate: [18, 11, 4, -2, 0, 0]
          }}
          transition={{
            delay: 3.5,
            duration: 2.62,
            times: [0, 0.24, 0.62, 0.86, 0.955, 1],
            ease: ["easeOut", "easeIn", [0.15, 0.88, 0.22, 1], [0.18, 0.86, 0.2, 1], "easeIn"]
          }}
        >
          <span />
        </motion.div>
      </div>

      <motion.div
        className="cinematic-intro__climax"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.12 }}
        animate={{ opacity: [0, 0.98, 0.55, 0], scale: [0.12, 0.72, 1.8, 3.2] }}
        transition={{ delay: 5.98, duration: 1.15, times: [0, 0.18, 0.5, 1], ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="cinematic-intro__backdrop-gear"
        aria-hidden="true"
        initial={{ opacity: 0, rotate: -12, scale: 0.7 }}
        animate={{ opacity: [0, 0.13, 0.13], rotate: [-12, 12, 34], scale: [0.7, 1, 1] }}
        transition={{ delay: 6, duration: 3, times: [0, 0.25, 1], ease: "easeOut" }}
      >
        <Cog />
      </motion.div>

      <div className="cinematic-intro__reveal">
        <motion.div
          className="cinematic-intro__logo-wrap"
          initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 6.02, type: "spring", stiffness: 190, damping: 15, mass: 0.9 }}
        >
          <OfficialLogoMark />
        </motion.div>

        <h1 className="cinematic-intro__title" aria-label={TITLE}>
          {TITLE.split("").map((character, index) => (
            <motion.span
              key={`${character}-${index}`}
              className={character === " " ? "cinematic-intro__letter--space" : undefined}
              aria-hidden="true"
              initial={{ opacity: 0, y: 28, scale: 0.78 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 7.5 + index * 0.055,
                type: "spring",
                stiffness: 340,
                damping: 15,
                mass: 0.72
              }}
            >
              {character === " " ? "\u00a0" : character}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="cinematic-intro__slogan"
          initial={{ opacity: 0, filter: "blur(12px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ delay: 8.15, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          Conectando você ao profissional certo
        </motion.p>
      </div>

      <motion.div
        className="cinematic-intro__letterbox cinematic-intro__letterbox--top"
        aria-hidden="true"
        animate={{ height: ["9vh", "9vh", "0vh"] }}
        transition={{ duration: 9, times: [0, 0.833, 1], ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="cinematic-intro__letterbox cinematic-intro__letterbox--bottom"
        aria-hidden="true"
        animate={{ height: ["9vh", "9vh", "0vh"] }}
        transition={{ duration: 9, times: [0, 0.833, 1], ease: [0.65, 0, 0.35, 1] }}
      />
    </motion.div>
  );
}

function OfficialLogoMark() {
  return (
    <div className="cinematic-intro__logo" aria-hidden="true">
      <Cog className="cinematic-intro__gear" />
      <Handshake className="cinematic-intro__handshake" />
    </div>
  );
}
