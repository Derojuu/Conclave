import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { getSupabaseAdminConfig } from "@/lib/supabase/config";

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
