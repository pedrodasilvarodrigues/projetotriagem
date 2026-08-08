import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CinematicIntro } from "@/components/app/cinematic-intro";
import { RouteTransition } from "@/components/app/route-transition";
import { UserPreferencesProvider } from "@/components/app/user-preferences-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  }
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
