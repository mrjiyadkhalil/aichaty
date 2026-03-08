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
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details_json: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details_json?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details_json?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          end_at: string | null
          id: string
          message: string
          placement: string
          start_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          id?: string
          message: string
          placement?: string
          start_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          id?: string
          message?: string
          placement?: string
          start_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          response_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          response_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          response_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "model_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string | null
          sent_by: string
          target: string
          target_user_ids: string[] | null
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string | null
          sent_by: string
          target?: string
          target_user_ids?: string[] | null
          title: string
          type?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          sent_by?: string
          target?: string
          target_user_ids?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      broadcast_reads: {
        Row: {
          broadcast_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          broadcast_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          broadcast_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_reads_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_tag_assignments: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_tag_assignments_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "chat_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          details_json: Json | null
          error_type: string
          id: string
          message: string
          model: string | null
          provider: string | null
          request_type: string | null
          resolved_at: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          error_type: string
          id?: string
          message: string
          model?: string | null
          provider?: string | null
          request_type?: string | null
          resolved_at?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          error_type?: string
          id?: string
          message?: string
          model?: string | null
          provider?: string | null
          request_type?: string | null
          resolved_at?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          enhanced_content: string | null
          file_context_ids: string[] | null
          final_content: string | null
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          enhanced_content?: string | null
          file_context_ids?: string[] | null
          final_content?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          enhanced_content?: string | null
          file_context_ids?: string[] | null
          final_content?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      model_configs: {
        Row: {
          api_key_env: string | null
          cost_tier: string
          enabled: boolean
          id: string
          is_custom: boolean
          max_output_tokens: number
          model_name: string
          premium_only: boolean
          provider_name: string
          provider_url: string | null
          request_format: Json | null
          retry_enabled: boolean
          short_label: string | null
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          api_key_env?: string | null
          cost_tier?: string
          enabled?: boolean
          id?: string
          is_custom?: boolean
          max_output_tokens?: number
          model_name: string
          premium_only?: boolean
          provider_name: string
          provider_url?: string | null
          request_format?: Json | null
          retry_enabled?: boolean
          short_label?: string | null
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          api_key_env?: string | null
          cost_tier?: string
          enabled?: boolean
          id?: string
          is_custom?: boolean
          max_output_tokens?: number
          model_name?: string
          premium_only?: boolean
          provider_name?: string
          provider_url?: string | null
          request_format?: Json | null
          retry_enabled?: boolean
          short_label?: string | null
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      model_responses: {
        Row: {
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          included_in_synthesis: boolean | null
          latency_ms: number | null
          message_id: string
          model: string
          status: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          included_in_synthesis?: boolean | null
          latency_ms?: number | null
          message_id: string
          model: string
          status?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          included_in_synthesis?: boolean | null
          latency_ms?: number | null
          message_id?: string
          model?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_responses_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_access_enabled: boolean
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string
          custom_hard_cap: number | null
          custom_soft_cap: number | null
          display_name: string | null
          id: string
          last_active_at: string | null
          status: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_access_enabled?: boolean
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          custom_hard_cap?: number | null
          custom_soft_cap?: number | null
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          status?: string
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_access_enabled?: boolean
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          custom_hard_cap?: number | null
          custom_soft_cap?: number | null
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          status?: string
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          custom_instruction: string | null
          description: string | null
          id: string
          name: string
          preferred_models: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_instruction?: string | null
          description?: string | null
          id?: string
          name: string
          preferred_models?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_instruction?: string | null
          description?: string | null
          id?: string
          name?: string
          preferred_models?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_api_keys: {
        Row: {
          env_key_name: string
          id: string
          is_set: boolean
          label: string | null
          provider_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          env_key_name: string
          id?: string
          is_set?: boolean
          label?: string | null
          provider_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          env_key_name?: string
          id?: string
          is_set?: boolean
          label?: string | null
          provider_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      provider_configs: {
        Row: {
          enabled: boolean
          id: string
          provider_name: string
          retry_enabled: boolean
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          provider_name: string
          retry_enabled?: boolean
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          provider_name?: string
          retry_enabled?: boolean
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          token: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          token?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      synthesis_results: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          source_models: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          source_models?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          source_models?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synthesis_results_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value_json: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      system_templates: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean
          id: string
          prompt_body: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          prompt_body: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          prompt_body?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          chat_id: string | null
          created_at: string
          error_code: string | null
          estimated_cost: number | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          message_id: string | null
          model: string
          output_tokens: number | null
          project_id: string | null
          provider: string
          request_type: string
          status: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          error_code?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model: string
          output_tokens?: number | null
          project_id?: string | null
          provider: string
          request_type: string
          status?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          error_code?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string
          output_tokens?: number | null
          project_id?: string | null
          provider?: string
          request_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          cost_mode: string
          created_at: string
          default_layout: string
          default_models: string[] | null
          id: string
          onboarding_completed: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_mode?: string
          created_at?: string
          default_layout?: string
          default_models?: string[] | null
          id?: string
          onboarding_completed?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_mode?: string
          created_at?: string
          default_layout?: string
          default_models?: string[] | null
          id?: string
          onboarding_completed?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      model_performance: {
        Row: {
          avg_latency_ms: number | null
          error_count: number | null
          max_latency_ms: number | null
          min_latency_ms: number | null
          model: string | null
          provider: string | null
          success_count: number | null
          success_rate: number | null
          total_cost: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      revenue_summary: {
        Row: {
          day: string | null
          model: string | null
          provider: string | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_requests: number | null
          total_revenue: number | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
