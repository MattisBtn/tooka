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
          caption: string | null
          created_at: string
          file_url: string
          id: string
          moodboard_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_url: string
          id?: string
          moodboard_id: string
        }
        Update: {
          caption?: string | null
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
      moodboards: {
        Row: {
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
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
          link_expires_at: string | null
          password_hash: string
          secure_link: string
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
          link_expires_at?: string | null
          password_hash: string
          secure_link: string
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
          link_expires_at?: string | null
          password_hash?: string
          secure_link?: string
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
      proposal_templates: {
        Row: {
          created_at: string
          id: string
          layout_config: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_config: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_config?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          contract_url: string | null
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean
          description: string | null
          id: string
          price: number
          project_id: string
          quote_url: string | null
          status: Database["public"]["Enums"]["status_enum"]
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          description?: string | null
          id?: string
          price: number
          project_id: string
          quote_url?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          description?: string | null
          id?: string
          price?: number
          project_id?: string
          quote_url?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          template_id?: string | null
          title?: string
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
          {
            foreignKeyName: "proposals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_templates"
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
          created_at: string
          file_url: string
          id: string
          is_selected: boolean
          selection_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          is_selected?: boolean
          selection_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          is_selected?: boolean
          selection_id?: string
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
      project_status: "draft" | "in_progress" | "completed"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_type: ["individual", "company"],
      project_status: ["draft", "in_progress", "completed"],
      status_enum: [
        "draft",
        "awaiting_client",
        "revision_requested",
        "completed",
      ],
    },
  },
} as const
