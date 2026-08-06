import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CinematicIntro } from "@/components/app/cinematic-intro";
import { RouteTransition } from "@/components/app/route-transition";
import { UserPreferencesProvider } from "@/components/app/user-preferences-provider";
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
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem("portal-encaixe:user-preferences:v1")||"null")||{tema:"automatico",tamanho_fonte:"medio",densidade:"confortavel"};var d=p.tema==="escuro"||(p.tema==="automatico"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=p.tema;r.dataset.fontSize=p.tamanho_fonte;r.dataset.density=p.densidade;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <a className="sr-only focus:not-sr-only" href="#conteudo">
          Pular para conteúdo principal
        </a>
        <CinematicIntro />
        <UserPreferencesProvider>
          <RouteTransition>{children}</RouteTransition>
        </UserPreferencesProvider>
      </body>
      <GoogleAnalytics gaId="G-BVE5QRQ75G" />
    </html>
  );
}
