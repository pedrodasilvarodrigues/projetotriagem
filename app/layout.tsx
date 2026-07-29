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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
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
