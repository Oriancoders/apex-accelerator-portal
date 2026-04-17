import type { Database } from "@/integrations/supabase/types";

export type Priority = Database["public"]["Enums"]["ticket_priority"];
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface SubTask {
  title: string;
}

export interface ProposalStep {
  hour: number;
  title: string;
  description: string;
  complexity: Difficulty;
  subtasks?: SubTask[];
}

export type ProposalCategory = "general" | "salesforce";
