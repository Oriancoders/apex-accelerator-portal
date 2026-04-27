import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFacingError } from "@/lib/errors";
import { phoneSchema, safeTextSchema } from "@/lib/validation";

export function useProfileData(userId?: string) {
  const { data: tickets = [] } = useQuery({
    queryKey: ["profile-tickets", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, status, credit_cost, estimated_hours, created_at, priority, difficulty_level, title")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["profile-transactions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["profile-reviews", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ticket_reviews")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return { tickets, transactions, reviews };
}

export function useProfileUpdate(userId?: string) {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const fullName = safeTextSchema(120, 1).parse(data.full_name);
      const phone = phoneSchema.parse(data.phone);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast({ title: "Error updating profile", variant: "destructive" }),
  });
}

export function usePasswordChange() {
  const { toast } = useToast();

  return async (newPassword: string, confirmPassword: string) => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return false;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({
        title: "Error changing password",
        description: getUserFacingError(error, "Unable to change password right now."),
        variant: "destructive",
      });
      return false;
    }
    toast({ title: "Password changed successfully" });
    return true;
  };
}
