import type { MetadataRoute } from "next";

const BASE_URL = "https://www.portalencaixe.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${BASE_URL}/sobre`,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${BASE_URL}/como-funciona`,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${BASE_URL}/vagas-publicas`,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/empresas-parceiras`,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${BASE_URL}/services`,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/contato`,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${BASE_URL}/termos-de-uso`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/lgpd`,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
