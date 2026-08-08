import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${SITE_URL}/sobre`,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${SITE_URL}/como-funciona`,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${SITE_URL}/vagas-publicas`,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${SITE_URL}/empresas-parceiras`,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${SITE_URL}/contato`,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${SITE_URL}/termos-de-uso`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${SITE_URL}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${SITE_URL}/lgpd`,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
