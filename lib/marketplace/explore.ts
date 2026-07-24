export const SERVICE_POSTS_BUCKET = "service-posts";
export const SERVICE_POST_MAX_IMAGES = 6;
export const SERVICE_POST_MAX_IMAGE_BYTES = 8_388_608;
export const SERVICE_POST_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ServicePost = {
  id: string;
  images: string[];
  description: string;
  created_at: string;
};

export type FeaturedProvider = {
  provider_id: string;
  full_name: string;
  avatar_path: string | null;
  professional_title: string;
  city: string;
  state: string;
  category_names: string[];
  rating_average: number;
  rating_count: number;
  latest_post_at: string;
  posts: ServicePost[];
};

export type ServicePostDetail = {
  post_id: string;
  provider_id: string;
  images: string[];
  description: string;
  created_at: string;
  full_name: string;
  avatar_path: string | null;
  professional_title: string;
  rating_average: number;
  rating_count: number;
  category_names: string[];
};

export function servicePostPublicUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : "";
}

export async function createServicePostSignedUrlMap(supabase: SupabaseClient, paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (!uniquePaths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from(SERVICE_POSTS_BUCKET).createSignedUrls(uniquePaths, 60 * 60);
  const urlMap = new Map<string, string>();
  data?.forEach((item, index) => {
    if (item.signedUrl) urlMap.set(uniquePaths[index], item.signedUrl);
  });
  return urlMap;
}

export function isUuid(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function normalizeFeaturedProviders(rows: unknown[] | null): FeaturedProvider[] {
  return (rows ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const rawPosts = Array.isArray(row.posts) ? row.posts : [];
    return {
      provider_id: String(row.provider_id),
      full_name: String(row.full_name ?? ""),
      avatar_path: row.avatar_path ? String(row.avatar_path) : null,
      professional_title: String(row.professional_title ?? ""),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      category_names: Array.isArray(row.category_names) ? row.category_names.map(String) : [],
      rating_average: Number(row.rating_average ?? 0),
      rating_count: Number(row.rating_count ?? 0),
      latest_post_at: String(row.latest_post_at ?? ""),
      posts: rawPosts.map((post) => {
        const item = post as Record<string, unknown>;
        return {
          id: String(item.id),
          images: Array.isArray(item.images) ? item.images.map(String) : [],
          description: String(item.description ?? ""),
          created_at: String(item.created_at ?? "")
        };
      })
    };
  });
}
import type { SupabaseClient } from "@supabase/supabase-js";
