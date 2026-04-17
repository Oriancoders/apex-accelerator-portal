import type { Tables } from "@/integrations/supabase/types";

export type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
export type VisibilityRow = Tables<"company_component_visibility">;
