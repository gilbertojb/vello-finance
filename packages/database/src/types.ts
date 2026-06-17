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
    PostgrestVersion: "14.5"
  }
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
      backoffice_users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["backoffice_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["backoffice_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["backoffice_role"]
          updated_at?: string
        }
        Relationships: []
      }
      client_access_attempts: {
        Row: {
          attempted_at: string
          cpf_hash: string | null
          id: string
          ip_hash: string
          success: boolean
          tenant_id: string
        }
        Insert: {
          attempted_at?: string
          cpf_hash?: string | null
          id?: string
          ip_hash: string
          success?: boolean
          tenant_id: string
        }
        Update: {
          attempted_at?: string
          cpf_hash?: string | null
          id?: string
          ip_hash?: string
          success?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_snapshots: {
        Row: {
          captured_at: string
          financial_partner_id: string | null
          id: string
          if_commission_amount: number | null
          if_commission_pct: number
          loan_amount: number | null
          paid_at: string | null
          product_id: string
          proposal_id: string
          tenant_commission_amount: number | null
          tenant_commission_pct: number
          tenant_id: string
          vello_commission_amount: number | null
          vello_commission_pct: number
          vello_spread_pct: number
        }
        Insert: {
          captured_at?: string
          financial_partner_id?: string | null
          id?: string
          if_commission_amount?: number | null
          if_commission_pct?: number
          loan_amount?: number | null
          paid_at?: string | null
          product_id: string
          proposal_id: string
          tenant_commission_amount?: number | null
          tenant_commission_pct?: number
          tenant_id: string
          vello_commission_amount?: number | null
          vello_commission_pct?: number
          vello_spread_pct?: number
        }
        Update: {
          captured_at?: string
          financial_partner_id?: string | null
          id?: string
          if_commission_amount?: number | null
          if_commission_pct?: number
          loan_amount?: number | null
          paid_at?: string | null
          product_id?: string
          proposal_id?: string
          tenant_commission_amount?: number | null
          tenant_commission_pct?: number
          tenant_id?: string
          vello_commission_amount?: number | null
          vello_commission_pct?: number
          vello_spread_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_snapshots_financial_partner_id_fkey"
            columns: ["financial_partner_id"]
            isOneToOne: false
            referencedRelation: "financial_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_snapshots_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_partners: {
        Row: {
          api_base_url: string | null
          api_key_enc: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_base_url?: string | null
          api_key_enc?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_base_url?: string | null
          api_key_enc?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          commission_pct: number
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_products: number | null
          monthly_fee: number | null
          name: string
          setup_fee: number
          type: string
          updated_at: string
        }
        Insert: {
          commission_pct: number
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_products?: number | null
          monthly_fee?: number | null
          name: string
          setup_fee?: number
          type: string
          updated_at?: string
        }
        Update: {
          commission_pct?: number
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_products?: number | null
          monthly_fee?: number | null
          name?: string
          setup_fee?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_financial_partners: {
        Row: {
          created_at: string
          financial_partner_id: string
          id: string
          if_commission_pct: number
          is_active: boolean
          product_id: string
          updated_at: string
          vello_commission_pct: number
        }
        Insert: {
          created_at?: string
          financial_partner_id: string
          id?: string
          if_commission_pct: number
          is_active?: boolean
          product_id: string
          updated_at?: string
          vello_commission_pct: number
        }
        Update: {
          created_at?: string
          financial_partner_id?: string
          id?: string
          if_commission_pct?: number
          is_active?: boolean
          product_id?: string
          updated_at?: string
          vello_commission_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_financial_partners_financial_partner_id_fkey"
            columns: ["financial_partner_id"]
            isOneToOne: false
            referencedRelation: "financial_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_financial_partners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          internal_description: string | null
          is_active: boolean
          max_amount: number | null
          max_rate_monthly: number | null
          max_term_months: number | null
          min_amount: number | null
          min_rate_monthly: number | null
          min_term_months: number | null
          name: string
          product_type_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          internal_description?: string | null
          is_active?: boolean
          max_amount?: number | null
          max_rate_monthly?: number | null
          max_term_months?: number | null
          min_amount?: number | null
          min_rate_monthly?: number | null
          min_term_months?: number | null
          name: string
          product_type_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          internal_description?: string | null
          is_active?: boolean
          max_amount?: number | null
          max_rate_monthly?: number | null
          max_term_months?: number | null
          min_amount?: number | null
          min_rate_monthly?: number | null
          min_term_months?: number | null
          name?: string
          product_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          proposal_id: string
          tenant_id: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          proposal_id: string
          tenant_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          proposal_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_document_access_log: {
        Row: {
          action: string
          document_type: string | null
          id: string
          ip_hash: string
          occurred_at: string
          proposal_id: string
          tenant_id: string
          user_agent_hash: string | null
        }
        Insert: {
          action: string
          document_type?: string | null
          id?: string
          ip_hash: string
          occurred_at?: string
          proposal_id: string
          tenant_id: string
          user_agent_hash?: string | null
        }
        Update: {
          action?: string
          document_type?: string | null
          id?: string
          ip_hash?: string
          occurred_at?: string
          proposal_id?: string
          tenant_id?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_document_access_log_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_document_access_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          id: string
          proposal_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          id?: string
          proposal_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          id?: string
          proposal_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_events: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          proposal_id: string
          tenant_id: string
          to_status: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          proposal_id: string
          tenant_id: string
          to_status: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          proposal_id?: string
          tenant_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_stages: {
        Row: {
          created_at: string
          id: string
          name: string
          order_num: number
          product_type_id: string
          timeout_unit: string | null
          timeout_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_num: number
          product_type_id: string
          timeout_unit?: string | null
          timeout_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_num?: number
          product_type_id?: string
          timeout_unit?: string | null
          timeout_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_stages_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_cpf_hash: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          current_step: string
          documents_submitted: boolean
          form_data: Json
          id: string
          product_id: string
          product_type_slug: string
          simulation_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_cpf_hash?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          current_step?: string
          documents_submitted?: boolean
          form_data?: Json
          id?: string
          product_id: string
          product_type_slug: string
          simulation_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_cpf_hash?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          current_step?: string
          documents_submitted?: boolean
          form_data?: Json
          id?: string
          product_id?: string
          product_type_slug?: string
          simulation_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          client_birthdate: string | null
          client_city: string | null
          client_cpf: string | null
          client_email: string | null
          client_income: number | null
          client_name: string
          client_phone: string
          created_at: string
          desired_amount: number
          desired_term_months: number
          estimated_payment: number | null
          estimated_rate: number | null
          id: string
          product_id: string
          seller_id: string | null
          simulation_data: Json | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_birthdate?: string | null
          client_city?: string | null
          client_cpf?: string | null
          client_email?: string | null
          client_income?: number | null
          client_name: string
          client_phone: string
          created_at?: string
          desired_amount: number
          desired_term_months: number
          estimated_payment?: number | null
          estimated_rate?: number | null
          id?: string
          product_id: string
          seller_id?: string | null
          simulation_data?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_birthdate?: string | null
          client_city?: string | null
          client_cpf?: string | null
          client_email?: string | null
          client_income?: number | null
          client_name?: string
          client_phone?: string
          created_at?: string
          desired_amount?: number
          desired_term_months?: number
          estimated_payment?: number | null
          estimated_rate?: number | null
          id?: string
          product_id?: string
          seller_id?: string | null
          simulation_data?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "tenant_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_triggers: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_template: Json | null
          stage_id: string
          timeout_unit: string | null
          timeout_value: number | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_template?: Json | null
          stage_id: string
          timeout_unit?: string | null
          timeout_value?: number | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_template?: Json | null
          stage_id?: string
          timeout_unit?: string | null
          timeout_value?: number | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_triggers_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "proposal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          auth_bg_image_url: string | null
          base_color: string | null
          company_display_name: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          template_id: string | null
          tenant_id: string
          theme_color: string | null
          updated_at: string
          use_custom_theme: boolean
        }
        Insert: {
          auth_bg_image_url?: string | null
          base_color?: string | null
          company_display_name?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          template_id?: string | null
          tenant_id: string
          theme_color?: string | null
          updated_at?: string
          use_custom_theme?: boolean
        }
        Update: {
          auth_bg_image_url?: string | null
          base_color?: string | null
          company_display_name?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          template_id?: string | null
          tenant_id?: string
          theme_color?: string | null
          updated_at?: string
          use_custom_theme?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_products: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean
          is_popular: boolean
          product_id: string
          tenant_commission_pct: number
          tenant_id: string
          updated_at: string
          vello_spread_pct: number
          video_url: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          product_id: string
          tenant_commission_pct: number
          tenant_id: string
          updated_at?: string
          vello_spread_pct: number
          video_url?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          product_id?: string
          tenant_commission_pct?: number
          tenant_id?: string
          updated_at?: string
          vello_spread_pct?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          activated_at: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          bank_pix_key: string | null
          cnpj: string | null
          company_name: string | null
          console_custom_domain: string | null
          created_at: string
          custom_domain: string | null
          email: string
          id: string
          name: string
          phone: string | null
          plan_id: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          suspended_at: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          updated_at: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          activated_at?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix_key?: string | null
          cnpj?: string | null
          company_name?: string | null
          console_custom_domain?: string | null
          created_at?: string
          custom_domain?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          plan_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          suspended_at?: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          activated_at?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix_key?: string | null
          cnpj?: string | null
          company_name?: string | null
          console_custom_domain?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          plan_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          suspended_at?: string | null
          type?: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      backoffice_role: "super_admin" | "admin" | "financial" | "support"
      tenant_role: "tenant_admin" | "tenant_operator"
      tenant_status: "pending" | "active" | "suspended" | "cancelled"
      tenant_type: "subscription" | "whitelabel"
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
    Enums: {
      backoffice_role: ["super_admin", "admin", "financial", "support"],
      tenant_role: ["tenant_admin", "tenant_operator"],
      tenant_status: ["pending", "active", "suspended", "cancelled"],
      tenant_type: ["subscription", "whitelabel"],
    },
  },
} as const
