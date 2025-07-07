export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          bic: string | null
          billing_address: string
          billing_city: string
          billing_country: string
          billing_email: string
          billing_phone: string | null
          billing_postal: string
          company_name: string | null
          created_at: string | null
          first_name: string | null
          iban: string | null
          id: string
          last_name: string | null
          notes: string | null
          siret: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          user_id: string
        }
        Insert: {
          bic?: string | null
          billing_address: string
          billing_city: string
          billing_country: string
          billing_email: string
          billing_phone?: string | null
          billing_postal: string
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          iban?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          siret?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          user_id: string
        }
        Update: {
          bic?: string | null
          billing_address?: string
          billing_city?: string
          billing_country?: string
          billing_email?: string
          billing_phone?: string | null
          billing_postal?: string
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          iban?: string | null
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
          created_at: string
          id: string
          payment_required: boolean
          project_id: string
          selection_id: string | null
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_required?: boolean
          project_id: string
          selection_id?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_required?: boolean
          project_id?: string
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
          created_at: string
          description: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboards_project_id_fkey"
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
          created_at: string
          description: string | null
          id: string
          initial_price: number | null
          password_expires_at: string | null
          password_hash: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          initial_price?: number | null
          password_expires_at?: string | null
          password_hash: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          initial_price?: number | null
          password_expires_at?: string | null
          password_hash?: string
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
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
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
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
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
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
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
          created_at: string
          extra_media_price: number | null
          id: string
          max_media_selection: number
          project_id: string
          status: Database["public"]["Enums"]["status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          extra_media_price?: number | null
          id?: string
          max_media_selection?: number
          project_id: string
          status?: Database["public"]["Enums"]["status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          extra_media_price?: number | null
          id?: string
          max_media_selection?: number
          project_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
      project_status: "draft" | "in_progress" | "completed"
      reaction_type: "love" | "like" | "dislike"
      status_enum:
        | "draft"
        | "awaiting_client"
        | "revision_requested"
        | "completed"
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
      project_status: ["draft", "in_progress", "completed"],
      reaction_type: ["love", "like", "dislike"],
      status_enum: [
        "draft",
        "awaiting_client",
        "revision_requested",
        "completed",
      ],
    },
  },
} as const
