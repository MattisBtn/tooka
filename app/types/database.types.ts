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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string
          billing_phone: string | null
          billing_postal: string | null
          company_name: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          siret: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email: string
          billing_phone?: string | null
          billing_postal?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          siret?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string
          billing_phone?: string | null
          billing_postal?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          siret?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          user_id?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          project_id: string
          requires_client_validation: boolean
          revision_last_comment: string | null
          selection_id: string | null
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          project_id: string
          requires_client_validation?: boolean
          revision_last_comment?: string | null
          selection_id?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          project_id?: string
          requires_client_validation?: boolean
          revision_last_comment?: string | null
          selection_id?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galleries_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_comments_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "gallery_images"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          created_at: string
          file_url: string
          gallery_id: string
          id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          gallery_id: string
          id?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          gallery_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboard_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_comments_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "moodboard_images"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboard_images: {
        Row: {
          created_at: string
          file_url: string
          id: string
          moodboard_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          moodboard_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          moodboard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_images_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboard_reactions: {
        Row: {
          created_at: string
          id: string
          image_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_reactions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "moodboard_images"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboards: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          revision_last_comment: string | null
          status: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      project_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          project_id: string
          reference_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          project_id: string
          reference_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          project_id?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          initial_price: number | null
          password_hash: string
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          remaining_amount: number | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_price?: number | null
          password_hash: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          remaining_amount?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_price?: number | null
          password_hash?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          remaining_amount?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          completed_at: string | null
          content_html: string
          content_json: Json
          contract_url: string | null
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean
          id: string
          price: number
          project_id: string
          quote_url: string | null
          revision_last_comment: string | null
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content_html: string
          content_json: Json
          contract_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          id?: string
          price: number
          project_id: string
          quote_url?: string | null
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content_html?: string
          content_json?: Json
          contract_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          id?: string
          price?: number
          project_id?: string
          quote_url?: string | null
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selection_comments_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "selection_images"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_images: {
        Row: {
          conversion_status:
            | Database["public"]["Enums"]["conversion_status_enum"]
            | null
          created_at: string
          file_url: string
          id: string
          is_selected: boolean
          requires_conversion: boolean | null
          selection_id: string
          source_file_url: string | null
          source_filename: string | null
          source_format: string | null
          target_format: string | null
        }
        Insert: {
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status_enum"]
            | null
          created_at?: string
          file_url: string
          id?: string
          is_selected?: boolean
          requires_conversion?: boolean | null
          selection_id: string
          source_file_url?: string | null
          source_filename?: string | null
          source_format?: string | null
          target_format?: string | null
        }
        Update: {
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status_enum"]
            | null
          created_at?: string
          file_url?: string
          id?: string
          is_selected?: boolean
          requires_conversion?: boolean | null
          selection_id?: string
          source_file_url?: string | null
          source_filename?: string | null
          source_format?: string | null
          target_format?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "selection_images_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
        ]
      }
      selections: {
        Row: {
          completed_at: string | null
          created_at: string
          extra_media_price: number | null
          id: string
          max_media_selection: number
          project_id: string
          revision_last_comment: string | null
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extra_media_price?: number | null
          id?: string
          max_media_selection?: number
          project_id: string
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extra_media_price?: number | null
          id?: string
          max_media_selection?: number
          project_id?: string
          revision_last_comment?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bank_account_holder: string | null
          bank_bic: string | null
          bank_iban: string | null
          bank_name: string | null
          company_address: string | null
          company_city: string | null
          company_country: string | null
          company_name: string | null
          company_postal_code: string | null
          company_siret: string | null
          company_tax_id: string | null
          created_at: string | null
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          phone: string | null
          plan_id: string | null
          preferred_currency: string | null
          stripe_account_id: string | null
          stripe_account_status:
            | Database["public"]["Enums"]["stripe_account_status_enum"]
            | null
          stripe_charges_enabled: boolean | null
          stripe_connected_at: string | null
          stripe_customer_id: string | null
          stripe_details_submitted: boolean | null
          stripe_payouts_enabled: boolean | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_name?: string | null
          company_postal_code?: string | null
          company_siret?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          plan_id?: string | null
          preferred_currency?: string | null
          stripe_account_id?: string | null
          stripe_account_status?:
            | Database["public"]["Enums"]["stripe_account_status_enum"]
            | null
          stripe_charges_enabled?: boolean | null
          stripe_connected_at?: string | null
          stripe_customer_id?: string | null
          stripe_details_submitted?: boolean | null
          stripe_payouts_enabled?: boolean | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_name?: string | null
          company_postal_code?: string | null
          company_siret?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          plan_id?: string | null
          preferred_currency?: string | null
          stripe_account_id?: string | null
          stripe_account_status?:
            | Database["public"]["Enums"]["stripe_account_status_enum"]
            | null
          stripe_charges_enabled?: boolean | null
          stripe_connected_at?: string | null
          stripe_customer_id?: string | null
          stripe_details_submitted?: boolean | null
          stripe_payouts_enabled?: boolean | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_kpi_view: {
        Row: {
          active_projects: number | null
          avg_days_to_complete: number | null
          avg_project_value: number | null
          completed_galleries: number | null
          completed_moodboards: number | null
          completed_projects: number | null
          completed_proposals: number | null
          completed_selections: number | null
          period: string | null
          total_billed: number | null
          total_projects: number | null
          unique_clients: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_project_remaining_amount: {
        Args: { p_project_id: string }
        Returns: number
      }
      calculate_project_total_price: {
        Args: { p_project_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      delete_storage_object: {
        Args: { bucket: string; object: string }
        Returns: Record<string, unknown>
      }
    }
    Enums: {
      client_type: "individual" | "company"
      conversion_status_enum:
        | "pending"
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "retrying"
        | "cancelled"
      payment_method_enum: "stripe" | "bank_transfer"
      payment_status_enum:
        | "not_initiated"
        | "initiated"
        | "pending"
        | "completed"
        | "failed"
      project_status: "draft" | "in_progress" | "completed"
      reaction_type: "love" | "like" | "dislike"
      status_enum:
        | "draft"
        | "awaiting_client"
        | "revision_requested"
        | "completed"
        | "payment_pending"
      stripe_account_status_enum:
        | "not_connected"
        | "pending"
        | "complete"
        | "restricted"
        | "rejected"
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
      client_type: ["individual", "company"],
      conversion_status_enum: [
        "pending",
        "queued",
        "processing",
        "completed",
        "failed",
        "retrying",
        "cancelled",
      ],
      payment_method_enum: ["stripe", "bank_transfer"],
      payment_status_enum: [
        "not_initiated",
        "initiated",
        "pending",
        "completed",
        "failed",
      ],
      project_status: ["draft", "in_progress", "completed"],
      reaction_type: ["love", "like", "dislike"],
      status_enum: [
        "draft",
        "awaiting_client",
        "revision_requested",
        "completed",
        "payment_pending",
      ],
      stripe_account_status_enum: [
        "not_connected",
        "pending",
        "complete",
        "restricted",
        "rejected",
      ],
    },
  },
} as const
