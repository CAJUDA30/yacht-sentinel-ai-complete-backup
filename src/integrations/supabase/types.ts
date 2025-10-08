export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_health: {
        Row: {
          created_at: string
          id: string
          last_check: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_check?: string | null
          provider_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_check?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_models_unified: {
        Row: {
          capabilities: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          max_context_length: number | null
          model_id: string
          model_name: string | null
          model_type: string | null
          name: string
          priority: number | null
          provider: string
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_context_length?: number | null
          model_id: string
          model_name?: string | null
          model_type?: string | null
          name: string
          priority?: number | null
          provider: string
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_context_length?: number | null
          model_id?: string
          model_name?: string | null
          model_type?: string | null
          name?: string
          priority?: number | null
          provider?: string
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_providers_unified: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          provider_type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_system_config: {
        Row: {
          config_key: string
          config_value: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          yacht_id: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          yacht_id?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_system_config_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          workflow_data: Json | null
          yacht_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          workflow_data?: Json | null
          yacht_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          workflow_data?: Json | null
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_workflows_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          updated_at: string
          yacht_id: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          updated_at?: string
          yacht_id?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          updated_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          certifications: Json | null
          created_at: string
          email: string | null
          emergency_contact: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          position: string | null
          updated_at: string
          user_id: string | null
          yacht_id: string | null
        }
        Insert: {
          certifications?: Json | null
          created_at?: string
          email?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
          yacht_id?: string | null
        }
        Update: {
          certifications?: Json | null
          created_at?: string
          email?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_ai_field_mappings: {
        Row: {
          ai_field_name: string
          approved_at: string | null
          approved_by: string | null
          confidence_threshold: number | null
          created_at: string | null
          created_by: string | null
          document_type: string
          field_type: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          mapping_metadata: Json | null
          mapping_name: string
          processor_id: string
          updated_at: string | null
          validation_rules: Json | null
          yacht_field_key: string
        }
        Insert: {
          ai_field_name: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          field_type?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          mapping_metadata?: Json | null
          mapping_name: string
          processor_id: string
          updated_at?: string | null
          validation_rules?: Json | null
          yacht_field_key: string
        }
        Update: {
          ai_field_name?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          field_type?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          mapping_metadata?: Json | null
          mapping_name?: string
          processor_id?: string
          updated_at?: string | null
          validation_rules?: Json | null
          yacht_field_key?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          installation_date: string | null
          last_maintenance_date: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          serial_number: string | null
          updated_at: string
          yacht_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          serial_number?: string | null
          updated_at?: string
          yacht_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          serial_number?: string | null
          updated_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yacht_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string
          dismissed: boolean | null
          id: string
          item_id: string | null
          message: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          dismissed?: boolean | null
          id?: string
          item_id?: string | null
          message: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          dismissed?: boolean | null
          id?: string
          item_id?: string | null
          message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          quantity: number | null
          unit: string | null
          updated_at: string
          yacht_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          yacht_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: Json | null
          updated_at: string
          yacht_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
          yacht_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_ai_configs: {
        Row: {
          config: Json
          config_key: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json
          config_key: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          config_key?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unified_ai_logs: {
        Row: {
          action: string | null
          correlation_id: string | null
          cost_estimate_usd: number | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          latency_ms: number | null
          provider: string | null
          success: boolean | null
        }
        Insert: {
          action?: string | null
          correlation_id?: string | null
          cost_estimate_usd?: number | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          success?: boolean | null
        }
        Update: {
          action?: string | null
          correlation_id?: string | null
          cost_estimate_usd?: number | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          yacht_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          yacht_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_profiles: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          profile_data: Json | null
          updated_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          profile_data?: Json | null
          updated_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          profile_data?: Json | null
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_profiles_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: true
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_name: string | null
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_name?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_name?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_to_yacht: {
        Args: {
          target_user_id: string
          target_yacht_id: string
          user_role?: string
        }
        Returns: boolean
      }
      get_user_yacht_access_detailed: {
        Args: { target_user_id?: string }
        Returns: {
          access_level: string
          permissions: Json
          yacht_id: string
          yacht_name: string
          yacht_type: string
        }[]
      }
      get_user_yacht_role: {
        Args: { user_uuid?: string }
        Returns: {
          role: string
          yacht_id: string
        }[]
      }
      is_global_superadmin: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

