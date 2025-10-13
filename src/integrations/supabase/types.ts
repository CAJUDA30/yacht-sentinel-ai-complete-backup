export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_health: {
        Row: {
          created_at: string
          id: string
          last_checked_at: string
          metadata: Json | null
          provider_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_checked_at?: string
          metadata?: Json | null
          provider_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          last_checked_at?: string
          metadata?: Json | null
          provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_health_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "ai_providers_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_health_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "ai_providers_with_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models_unified: {
        Row: {
          capabilities: Json | null
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          input_cost_per_token: number | null
          is_active: boolean | null
          max_tokens: number | null
          model_type: string | null
          name: string
          output_cost_per_token: number | null
          priority: number | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          input_cost_per_token?: number | null
          is_active?: boolean | null
          max_tokens?: number | null
          model_type?: string | null
          name: string
          output_cost_per_token?: number | null
          priority?: number | null
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          input_cost_per_token?: number | null
          is_active?: boolean | null
          max_tokens?: number | null
          model_type?: string | null
          name?: string
          output_cost_per_token?: number | null
          priority?: number | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_unified_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_models_unified_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_with_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          latency_ms: number | null
          message: string | null
          provider_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          message?: string | null
          provider_id: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          message?: string | null
          provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_provider_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_with_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers_unified: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          api_secret_name: string | null
          auth_header_name: string | null
          auth_method: string | null
          auth_type: string | null
          base_url: string | null
          capabilities: Json | null
          config: Json | null
          configuration: Json | null
          created_at: string
          description: string | null
          discovery_url: string | null
          error_count: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_health_check: string | null
          models_endpoint: string | null
          name: string
          priority: number | null
          provider_type: string | null
          rate_limit_per_minute: number | null
          success_rate: number | null
          supported_languages: string[] | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          api_secret_name?: string | null
          auth_header_name?: string | null
          auth_method?: string | null
          auth_type?: string | null
          base_url?: string | null
          capabilities?: Json | null
          config?: Json | null
          configuration?: Json | null
          created_at?: string
          description?: string | null
          discovery_url?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_health_check?: string | null
          models_endpoint?: string | null
          name: string
          priority?: number | null
          provider_type?: string | null
          rate_limit_per_minute?: number | null
          success_rate?: number | null
          supported_languages?: string[] | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          api_secret_name?: string | null
          auth_header_name?: string | null
          auth_method?: string | null
          auth_type?: string | null
          base_url?: string | null
          capabilities?: Json | null
          config?: Json | null
          configuration?: Json | null
          created_at?: string
          description?: string | null
          discovery_url?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_health_check?: string | null
          models_endpoint?: string | null
          name?: string
          priority?: number | null
          provider_type?: string | null
          rate_limit_per_minute?: number | null
          success_rate?: number | null
          supported_languages?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          metadata: Json | null
          module: string
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          metadata?: Json | null
          module: string
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          metadata?: Json | null
          module?: string
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          schedule_config: Json | null
          updated_at: string | null
          updated_by: string | null
          workflow_config: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          schedule_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          workflow_config?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          schedule_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          workflow_config?: Json
        }
        Relationships: []
      }
      document_ai_processors: {
        Row: {
          accuracy: number | null
          confidence_threshold: number | null
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          estimated_cost_per_page: number | null
          gcp_credentials_encrypted: string | null
          gcp_service_account_encrypted: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_test_result: Json | null
          last_test_status: string | null
          last_tested_at: string | null
          location: string
          max_pages_per_document: number | null
          name: string
          priority: number | null
          processor_full_id: string
          processor_id: string
          processor_type: string
          project_id: string
          rate_limit_per_minute: number | null
          specialization: string
          supported_formats: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          estimated_cost_per_page?: number | null
          gcp_credentials_encrypted?: string | null
          gcp_service_account_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_result?: Json | null
          last_test_status?: string | null
          last_tested_at?: string | null
          location?: string
          max_pages_per_document?: number | null
          name: string
          priority?: number | null
          processor_full_id: string
          processor_id: string
          processor_type?: string
          project_id?: string
          rate_limit_per_minute?: number | null
          specialization: string
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          estimated_cost_per_page?: number | null
          gcp_credentials_encrypted?: string | null
          gcp_service_account_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_result?: Json | null
          last_test_status?: string | null
          last_tested_at?: string | null
          location?: string
          max_pages_per_document?: number | null
          name?: string
          priority?: number | null
          processor_full_id?: string
          processor_id?: string
          processor_type?: string
          project_id?: string
          rate_limit_per_minute?: number | null
          specialization?: string
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      edge_function_health: {
        Row: {
          created_at: string
          error: Json | null
          function_name: string
          id: string
          last_checked_at: string
          latency_ms: number | null
          metadata: Json | null
          region: string | null
          status: string
          version: string | null
        }
        Insert: {
          created_at?: string
          error?: Json | null
          function_name: string
          id?: string
          last_checked_at?: string
          latency_ms?: number | null
          metadata?: Json | null
          region?: string | null
          status: string
          version?: string | null
        }
        Update: {
          created_at?: string
          error?: Json | null
          function_name?: string
          id?: string
          last_checked_at?: string
          latency_ms?: number | null
          metadata?: Json | null
          region?: string | null
          status?: string
          version?: string | null
        }
        Relationships: []
      }
      edge_function_settings: {
        Row: {
          created_at: string
          department: string | null
          enabled: boolean | null
          feature_flag: string | null
          function_name: string
          id: string
          timeout_ms: number | null
          updated_at: string
          verify_jwt: boolean | null
          warm_schedule: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          enabled?: boolean | null
          feature_flag?: string | null
          function_name: string
          id?: string
          timeout_ms?: number | null
          updated_at?: string
          verify_jwt?: boolean | null
          warm_schedule?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          enabled?: boolean | null
          feature_flag?: string | null
          function_name?: string
          id?: string
          timeout_ms?: number | null
          updated_at?: string
          verify_jwt?: boolean | null
          warm_schedule?: string | null
        }
        Relationships: []
      }
      event_bus: {
        Row: {
          created_at: string
          department: string | null
          event_type: string
          id: string
          module: string | null
          payload: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          event_type: string
          id?: string
          module?: string | null
          payload?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          event_type?: string
          id?: string
          module?: string | null
          payload?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          quantity: number | null
          total_value: number | null
          unit_price: number | null
          updated_at: string | null
          updated_by: string | null
          yacht_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          quantity?: number | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
          yacht_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          quantity?: number | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
          yacht_id?: string | null
        }
        Relationships: []
      }
      llm_provider_models: {
        Row: {
          capabilities: Json | null
          created_at: string
          fetched_at: string
          id: string
          model_id: string
          model_name: string
          provider_id: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          model_id: string
          model_name: string
          provider_id: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          model_id?: string
          model_name?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_provider_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_provider_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers_with_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          permission: string
          resource: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          permission: string
          resource?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          permission?: string
          resource?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      unified_ai_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          id: string
          job_title: string | null
          last_active_at: string | null
          onboarding_completed: boolean | null
          phone: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          department: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      yacht_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          owner_id: string | null
          profile_data: Json | null
          profile_name: string
          updated_at: string | null
          yacht_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          profile_data?: Json | null
          profile_name: string
          updated_at?: string | null
          yacht_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          profile_data?: Json | null
          profile_name?: string
          updated_at?: string | null
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yacht_profiles_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          created_at: string | null
          flag_state: string | null
          id: string
          length_meters: number | null
          metadata: Json | null
          name: string
          owner_id: string | null
          type: string | null
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          created_at?: string | null
          flag_state?: string | null
          id?: string
          length_meters?: number | null
          metadata?: Json | null
          name: string
          owner_id?: string | null
          type?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          created_at?: string | null
          flag_state?: string | null
          id?: string
          length_meters?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          type?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      active_document_processors: {
        Row: {
          accuracy: number | null
          configuration: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string | null
          name: string | null
          priority: number | null
          processor_full_id: string | null
          processor_id: string | null
          processor_type: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_providers_with_keys: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          api_key_encrypted: string | null
          auth_method: string | null
          auth_type: string | null
          base_url: string | null
          capabilities: Json | null
          config: Json | null
          created_at: string | null
          description: string | null
          error_count: number | null
          health_status: string | null
          id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          last_health_check: string | null
          name: string | null
          priority: number | null
          provider_type: string | null
          rate_limit_per_minute: number | null
          success_rate: number | null
          supported_languages: string[] | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: never
          api_key_encrypted?: string | null
          auth_method?: string | null
          auth_type?: string | null
          base_url?: string | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_health_check?: string | null
          name?: string | null
          priority?: number | null
          provider_type?: string | null
          rate_limit_per_minute?: number | null
          success_rate?: number | null
          supported_languages?: string[] | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: never
          api_key_encrypted?: string | null
          auth_method?: string | null
          auth_type?: string | null
          base_url?: string | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_health_check?: string | null
          name?: string | null
          priority?: number | null
          provider_type?: string | null
          rate_limit_per_minute?: number | null
          success_rate?: number | null
          supported_languages?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_ai_processors_with_credentials: {
        Row: {
          accuracy: number | null
          confidence_threshold: number | null
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string | null
          estimated_cost_per_page: number | null
          gcp_credentials: string | null
          gcp_credentials_encrypted: string | null
          gcp_service_account: string | null
          gcp_service_account_encrypted: string | null
          id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          location: string | null
          max_pages_per_document: number | null
          name: string | null
          priority: number | null
          processor_full_id: string | null
          processor_id: string | null
          processor_type: string | null
          project_id: string | null
          rate_limit_per_minute: number | null
          specialization: string | null
          supported_formats: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          estimated_cost_per_page?: number | null
          gcp_credentials?: never
          gcp_credentials_encrypted?: string | null
          gcp_service_account?: never
          gcp_service_account_encrypted?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          location?: string | null
          max_pages_per_document?: number | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          project_id?: string | null
          rate_limit_per_minute?: number | null
          specialization?: string | null
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          estimated_cost_per_page?: number | null
          gcp_credentials?: never
          gcp_credentials_encrypted?: string | null
          gcp_service_account?: never
          gcp_service_account_encrypted?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          location?: string | null
          max_pages_per_document?: number | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          project_id?: string | null
          rate_limit_per_minute?: number | null
          specialization?: string | null
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      document_ai_processors_with_status: {
        Row: {
          accuracy: number | null
          confidence_threshold: number | null
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string | null
          estimated_cost_per_page: number | null
          gcp_credentials_encrypted: string | null
          gcp_service_account_encrypted: string | null
          id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          last_test_result: Json | null
          last_test_status: string | null
          last_tested_at: string | null
          location: string | null
          max_pages_per_document: number | null
          name: string | null
          priority: number | null
          processor_full_id: string | null
          processor_id: string | null
          processor_type: string | null
          project_id: string | null
          rate_limit_per_minute: number | null
          specialization: string | null
          status_summary: string | null
          supported_formats: string[] | null
          test_freshness: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          estimated_cost_per_page?: number | null
          gcp_credentials_encrypted?: string | null
          gcp_service_account_encrypted?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_result?: Json | null
          last_test_status?: string | null
          last_tested_at?: string | null
          location?: string | null
          max_pages_per_document?: number | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          project_id?: string | null
          rate_limit_per_minute?: number | null
          specialization?: string | null
          status_summary?: never
          supported_formats?: string[] | null
          test_freshness?: never
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accuracy?: number | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          estimated_cost_per_page?: number | null
          gcp_credentials_encrypted?: string | null
          gcp_service_account_encrypted?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_result?: Json | null
          last_test_status?: string | null
          last_tested_at?: string | null
          location?: string | null
          max_pages_per_document?: number | null
          name?: string | null
          priority?: number | null
          processor_full_id?: string | null
          processor_id?: string | null
          processor_type?: string | null
          project_id?: string | null
          rate_limit_per_minute?: number | null
          specialization?: string | null
          status_summary?: never
          supported_formats?: string[] | null
          test_freshness?: never
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: {
          _department?: string
          _expires_at?: string
          _granted_by?: string
          _role: string
          _user_id: string
        }
        Returns: boolean
      }
      check_user_creation_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric: string
          status: string
          value: number
        }[]
      }
      check_user_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      cleanup_conflicting_rls_policies: {
        Args: { p_table_name: string }
        Returns: undefined
      }
      current_user_is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      decrypt_api_key: {
        Args: { encrypted_key: string }
        Returns: string
      }
      encrypt_api_key: {
        Args: { plain_key: string }
        Returns: string
      }
      enforce_standard_rls_policies: {
        Args: { p_include_owner_access?: boolean; p_table_name: string }
        Returns: undefined
      }
      ensure_user_role: {
        Args: { role_param?: string; user_id_param: string }
        Returns: undefined
      }
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: {
          department: string
          expires_at: string
          is_active: boolean
          role: string
        }[]
      }
      is_encrypted: {
        Args: { value: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never> | { _user_id?: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          _action?: string
          _permission: string
          _resource?: string
          _user_id?: string
        }
        Returns: boolean
      }
      verify_rls_integrity: {
        Args: { p_table_name: string }
        Returns: Json
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

