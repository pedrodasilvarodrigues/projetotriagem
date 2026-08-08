import type { Metadata } from "next";

export const SITE_NAME = "Portal Encaixe";
export const SITE_URL = "https://www.portalencaixe.com.br";
export const SITE_DESCRIPTION =
  "Conectamos profissionais e empresas com currículos organizados, vagas, triagem e encaminhamentos acompanhados.";

type PublicMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  absoluteTitle?: boolean;
};

export function absoluteSiteUrl(path: PublicMetadataOptions["path"] = "/") {
  return new URL(path, `${SITE_URL}/`);
}

export function createPublicMetadata({
  title,
  description,
  path,
  absoluteTitle = false
}: PublicMetadataOptions): Metadata {
  const canonical = absoluteSiteUrl(path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website"
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}
