import type { Metadata } from "next";
import { CinematicIntro } from "@/components/app/cinematic-intro";
import { RouteTransition } from "@/components/app/route-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Triagem Profissional",
  description: "Triagem privada, compatibilidade profissional e encaminhamento administrado."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="sr-only focus:not-sr-only" href="#conteudo">
          Pular para conteúdo principal
        </a>
        <CinematicIntro />
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
