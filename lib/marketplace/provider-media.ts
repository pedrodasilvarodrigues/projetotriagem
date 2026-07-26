import "server-only";

import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function attachProviderCoverUrls<T extends { provider_id: string }>(providers: T[]) {
  if (!providers.length || !hasSupabaseAdminEnv()) {
    return providers.map((provider) => ({ ...provider, cover_image_url: null as string | null }));
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("service_provider_profiles")
    .select("id,cover_image_path")
    .in("id", providers.map((provider) => provider.provider_id));
  const pathByProvider = new Map((profiles ?? []).map((profile) => [profile.id, profile.cover_image_path as string | null]));
  const paths = Array.from(new Set((profiles ?? []).map((profile) => profile.cover_image_path as string | null).filter((path): path is string => Boolean(path))));
  const { data: signed } = paths.length
    ? await admin.storage.from("provider-portfolios").createSignedUrls(paths, 60 * 60)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((item, index) => [paths[index], item.signedUrl]));

  return providers.map((provider) => {
    const path = pathByProvider.get(provider.provider_id);
    return { ...provider, cover_image_url: path ? urlByPath.get(path) ?? null : null };
  });
}

export async function getProviderCoverUrl(providerId: string) {
  const [provider] = await attachProviderCoverUrls([{ provider_id: providerId }]);
  return provider?.cover_image_url ?? null;
}
