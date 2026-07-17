"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

type ViewState = { pathname: string; content: ReactNode };

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const latestChildren = useRef(children);
  const timers = useRef<number[]>([]);
  const [view, setView] = useState<ViewState>({ pathname, content: children });
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  latestChildren.current = children;

  useEffect(() => {
    if (view.pathname === pathname) return;

    timers.current.forEach(window.clearTimeout);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView({ pathname, content: latestChildren.current });
      setPhase("idle");
      return;
    }

    setPhase("exit");
    timers.current = [
      window.setTimeout(() => {
        setView({ pathname, content: latestChildren.current });
        setPhase("enter");
      }, 170),
      window.setTimeout(() => setPhase("idle"), 480)
    ];

    return () => timers.current.forEach(window.clearTimeout);
  }, [pathname, view.pathname]);

  return (
    <div className={`route-transition route-transition--${phase}`}>
      <div className="route-transition__pulse" aria-hidden="true" />
      <div className="route-transition__content">{view.pathname === pathname && phase === "idle" ? children : view.content}</div>
    </div>
  );
}
