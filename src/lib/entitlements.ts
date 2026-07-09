import { createClient } from "@/lib/supabase/server";

/**
 * Returns true if the signed-in user holds any entitlement (i.e. has purchased).
 * RLS also enforces question access at the DB layer; this is for UI gating.
 */
export async function hasEntitlement(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
