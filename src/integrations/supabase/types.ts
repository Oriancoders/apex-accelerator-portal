export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author: string | null
          category: string
          content: string
          created_at: string
          id: string
          published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category: string
          content: string
          created_at?: string
          id?: string
          published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_type: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_type?: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_type?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      credit_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          stripe_session_id: string | null
          ticket_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          ticket_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          ticket_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      extensions: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          name: string
          published: boolean | null
          updated_at: string
          url: string
          users_count: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          name: string
          published?: boolean | null
          updated_at?: string
          url?: string
          users_count?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          published?: boolean | null
          updated_at?: string
          url?: string
          users_count?: string | null
        }
        Relationships: []
      }
      news_items: {
        Row: {
          category: string
          created_at: string
          id: string
          published: boolean | null
          summary: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          published?: boolean | null
          summary: string
          title: string
          updated_at?: string
          url?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          published?: boolean | null
          summary?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          ticket_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          ticket_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          ticket_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          credits: number
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_events: {
        Row: {
          attachments: string[] | null
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          ticket_id: string
          to_status: string
        }
        Insert: {
          attachments?: string[] | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          ticket_id: string
          to_status: string
        }
        Update: {
          attachments?: string[] | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          ticket_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating_overall: number | null
          rating_timeliness: number | null
          rating_value: number | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating_overall?: number | null
          rating_timeliness?: number | null
          rating_value?: number | null
          ticket_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating_overall?: number | null
          rating_timeliness?: number | null
          rating_value?: number | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reviews_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_updates: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          credit_cost: number | null
          description: string
          difficulty_level:
            | Database["public"]["Enums"]["ticket_difficulty"]
            | null
          estimated_hours: number | null
          expert_opinion: string | null
          file_urls: string[] | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          solution_roadmap: Json | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          uat_attachments: string[] | null
          uat_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_cost?: number | null
          description: string
          difficulty_level?:
            | Database["public"]["Enums"]["ticket_difficulty"]
            | null
          estimated_hours?: number | null
          expert_opinion?: string | null
          file_urls?: string[] | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          solution_roadmap?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          uat_attachments?: string[] | null
          uat_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_cost?: number | null
          description?: string
          difficulty_level?:
            | Database["public"]["Enums"]["ticket_difficulty"]
            | null
          estimated_hours?: number | null
          expert_opinion?: string | null
          file_urls?: string[] | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          solution_roadmap?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          uat_attachments?: string[] | null
          uat_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_purchase_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_stripe_session_id: string
          p_user_id: string
        }
        Returns: number
      }
      admin_adjust_credits: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_message: string
          p_ticket_id?: string
          p_title: string
          p_type: string
          p_user_id?: string
        }
        Returns: undefined
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_ticket_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      ticket_difficulty: "easy" | "medium" | "hard" | "expert"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "in_progress"
        | "uat"
        | "completed"
        | "closed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      ticket_difficulty: ["easy", "medium", "hard", "expert"],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: [
        "submitted",
        "under_review",
        "approved",
        "in_progress",
        "uat",
        "completed",
        "closed",
        "cancelled",
      ],
    },
  },
} as const
