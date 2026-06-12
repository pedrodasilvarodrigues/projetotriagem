import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";

export function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    return {
      supabaseUrl: new URL(supabaseUrl).toString(),
      supabaseAnonKey
    };
  } catch {
    return null;
  }
}

export async function createServerClient() {
  const cookieStore = await cookies();
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createSsrServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write cookies. The proxy refreshes auth cookies for them.
          }
        }
      }
    }
  );
}
