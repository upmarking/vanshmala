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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      family_members: {
        Row: {
          added_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          full_name: string
          full_name_hi: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          generation_level: number | null
          gotra: string | null
          id: string
          is_alive: boolean | null
          phone: string | null
          tree_id: string
          updated_at: string
          user_id: string | null
          vanshmala_id: string
          username: string | null
          place_of_birth: string | null
          blood_group: string | null
          marriage_date: string | null
          education: Json
          career: Json
          achievements: string[] | null
          awards: string[] | null
          migration_info: Json
          privacy_settings: Json
        }
        Insert: {
          added_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation_level?: number | null
          gotra?: string | null
          id?: string
          is_alive?: boolean | null
          phone?: string | null
          tree_id: string
          updated_at?: string
          user_id?: string | null
          vanshmala_id?: string
          username?: string | null
          place_of_birth?: string | null
          blood_group?: string | null
          marriage_date?: string | null
          education?: Json
          career?: Json
          achievements?: string[] | null
          awards?: string[] | null
          migration_info?: Json
          privacy_settings?: Json
        }
        Update: {
          added_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name?: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation_level?: number | null
          gotra?: string | null
          id?: string
          is_alive?: boolean | null
          phone?: string | null
          tree_id?: string
          updated_at?: string
          user_id?: string | null
          vanshmala_id?: string
          username?: string | null
          place_of_birth?: string | null
          blood_group?: string | null
          marriage_date?: string | null
          education?: Json
          career?: Json
          achievements?: string[] | null
          awards?: string[] | null
          migration_info?: Json
          privacy_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "family_members_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_relationships: {
        Row: {
          created_at: string
          from_member_id: string
          id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          to_member_id: string
          tree_id: string
        }
        Insert: {
          created_at?: string
          from_member_id: string
          id?: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          to_member_id: string
          tree_id: string
        }
        Update: {
          created_at?: string
          from_member_id?: string
          id?: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          to_member_id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_trees: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          family_id: string
          family_name: string
          family_name_hi: string | null
          gotra: string | null
          id: string
          kuldevi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_id?: string
          family_name: string
          family_name_hi?: string | null
          gotra?: string | null
          id?: string
          kuldevi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_id?: string
          family_name?: string
          family_name_hi?: string | null
          gotra?: string | null
          id?: string
          kuldevi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      merge_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          requested_by: string | null
          resolved_at: string | null
          source_member_id: string
          status: Database["public"]["Enums"]["merge_status"] | null
          target_member_id: string
          tree_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          source_member_id: string
          status?: Database["public"]["Enums"]["merge_status"] | null
          target_member_id: string
          tree_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          source_member_id?: string
          status?: Database["public"]["Enums"]["merge_status"] | null
          target_member_id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_requests_source_member_id_fkey"
            columns: ["source_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          full_name_hi: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          gotra: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          vanshmala_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gotra?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          vanshmala_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gotra?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          vanshmala_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          id: string
          family_member_id: string
          title: string
          date: string | null
          event_type: string
          description: string | null
          media_urls: Json[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_member_id: string
          title: string
          date?: string | null
          event_type: string
          description?: string | null
          media_urls?: Json[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_member_id?: string
          title?: string
          date?: string | null
          event_type?: string
          description?: string | null
          media_urls?: Json[] | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          }
        ]
      }
      legacy_messages: {
        Row: {
          id: string
          creator_id: string
          recipient_id: string | null
          target_family_member_id: string | null
          title: string
          content_type: string
          media_url: string | null
          message_text: string | null
          unlock_condition: string
          unlock_date: string | null
          is_unlocked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          recipient_id?: string | null
          target_family_member_id?: string | null
          title: string
          content_type: string
          media_url?: string | null
          message_text?: string | null
          unlock_condition: string
          unlock_date?: string | null
          is_unlocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          recipient_id?: string | null
          target_family_member_id?: string | null
          title?: string
          content_type?: string
          media_url?: string | null
          message_text?: string | null
          unlock_condition?: string
          unlock_date?: string | null
          is_unlocked?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_messages_target_family_member_id_fkey"
            columns: ["target_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          }
        ]
      }
      tree_memberships: {
        Row: {
          id: string
          joined_at: string
          member_id: string | null
          role: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          member_id?: string | null
          role?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          member_id?: string | null
          role?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_memberships_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      generate_vanshmala_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tree_admin: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      is_tree_member: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      gender_type: "male" | "female" | "other"
      merge_status: "pending" | "approved" | "rejected"
      relationship_type: "parent" | "child" | "spouse" | "sibling"
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
      gender_type: ["male", "female", "other"],
      merge_status: ["pending", "approved", "rejected"],
      relationship_type: ["parent", "child", "spouse", "sibling"],
    },
  },
} as const
