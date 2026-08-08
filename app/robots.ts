import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/acesso-negado",
        "/admin",
        "/administrador",
        "/api",
        "/auth",
        "/client",
        "/company",
        "/confirm-email",
        "/forgot-password",
        "/login",
        "/marketplace",
        "/onboarding",
        "/professional",
        "/register",
        "/services",
        "/update-password"
      ]
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
