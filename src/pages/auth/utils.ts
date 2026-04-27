import { supabase } from "@/integrations/supabase/client";

export async function getPostLoginPath(userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const role = data?.role as string | undefined;

  if (role === "admin") return "/admin";
  if (role === "consultant") return "/consultant/dashboard";
  if (role === "agent") {
    const { data: agentProfile } = await supabase
      .from("agents")
      .select("id, is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (agentProfile?.is_active) return "/agent/dashboard";
  }
  return "/dashboard";
}
