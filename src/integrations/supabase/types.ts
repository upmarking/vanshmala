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
      app_review_offers: {
        Row: {
          consent_given: boolean
          created_at: string
          id: string
          screenshot_url: string
          user_id: string
        }
        Insert: {
          consent_given?: boolean
          created_at?: string
          id?: string
          screenshot_url: string
          user_id: string
        }
        Update: {
          consent_given?: boolean
          created_at?: string
          id?: string
          screenshot_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_review_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      discount_code_usage: {
        Row: {
          amount_added: number
          created_at: string
          discount_amount: number
          discount_code_id: string
          id: string
          user_id: string
        }
        Insert: {
          amount_added: number
          created_at?: string
          discount_amount: number
          discount_code_id: string
          id?: string
          user_id: string
        }
        Update: {
          amount_added?: number
          created_at?: string
          discount_amount?: number
          discount_code_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          description_hi: string | null
          discount_percentage: number
          id: string
          is_active: boolean
          max_discount: number
          max_uses: number | null
          min_transaction_value: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          description_hi?: string | null
          discount_percentage: number
          id?: string
          is_active?: boolean
          max_discount: number
          max_uses?: number | null
          min_transaction_value?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          description_hi?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean
          max_discount?: number
          max_uses?: number | null
          min_transaction_value?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          access_level: string | null
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          generation_level: number | null
          id: string
          title: string
          tree_id: string
          uploader_id: string | null
        }
        Insert: {
          access_level?: string | null
          category: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          generation_level?: number | null
          id?: string
          title: string
          tree_id: string
          uploader_id?: string | null
        }
        Update: {
          access_level?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          generation_level?: number | null
          id?: string
          title?: string
          tree_id?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          achievements: string[] | null
          added_by: string | null
          avatar_url: string | null
          awards: string[] | null
          bio: string | null
          blood_group: string | null
          career: Json | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          education: Json | null
          email: string | null
          full_name: string
          full_name_hi: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          generation_level: number | null
          gotra: string | null
          id: string
          is_alive: boolean | null
          kuldevi: string | null
          kuldevta: string | null
          marriage_date: string | null
          migration_info: Json | null
          mool_niwas: string | null
          phone: string | null
          place_of_birth: string | null
          privacy_settings: Json | null
          tree_id: string
          updated_at: string
          user_id: string | null
          username: string | null
          vanshmala_id: string | null
        }
        Insert: {
          achievements?: string[] | null
          added_by?: string | null
          avatar_url?: string | null
          awards?: string[] | null
          bio?: string | null
          blood_group?: string | null
          career?: Json | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          education?: Json | null
          email?: string | null
          full_name: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation_level?: number | null
          gotra?: string | null
          id?: string
          is_alive?: boolean | null
          kuldevi?: string | null
          kuldevta?: string | null
          marriage_date?: string | null
          migration_info?: Json | null
          mool_niwas?: string | null
          phone?: string | null
          place_of_birth?: string | null
          privacy_settings?: Json | null
          tree_id: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
          vanshmala_id?: string | null
        }
        Update: {
          achievements?: string[] | null
          added_by?: string | null
          avatar_url?: string | null
          awards?: string[] | null
          bio?: string | null
          blood_group?: string | null
          career?: Json | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation_level?: number | null
          gotra?: string | null
          id?: string
          is_alive?: boolean | null
          kuldevi?: string | null
          kuldevta?: string | null
          marriage_date?: string | null
          migration_info?: Json | null
          mool_niwas?: string | null
          phone?: string | null
          place_of_birth?: string | null
          privacy_settings?: Json | null
          tree_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
          vanshmala_id?: string | null
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
          public_share_token: string | null
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
          public_share_token?: string | null
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
          public_share_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          comments: Json
          content: string
          created_at: string
          id: string
          likes: Json
          post_type: string
          sub_type: string | null
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments?: Json
          content: string
          created_at?: string
          id?: string
          likes?: Json
          post_type: string
          sub_type?: string | null
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments?: Json
          content?: string
          created_at?: string
          id?: string
          likes?: Json
          post_type?: string
          sub_type?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_redeemed: boolean
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: []
      }
      legacy_messages: {
        Row: {
          content_type: string | null
          created_at: string
          creator_id: string
          id: string
          is_unlocked: boolean | null
          media_url: string | null
          message_text: string | null
          recipient_id: string | null
          target_family_member_id: string | null
          title: string
          unlock_condition: string | null
          unlock_date: string | null
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          creator_id: string
          id?: string
          is_unlocked?: boolean | null
          media_url?: string | null
          message_text?: string | null
          recipient_id?: string | null
          target_family_member_id?: string | null
          title: string
          unlock_condition?: string | null
          unlock_date?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          is_unlocked?: boolean | null
          media_url?: string | null
          message_text?: string | null
          recipient_id?: string | null
          target_family_member_id?: string | null
          title?: string
          unlock_condition?: string | null
          unlock_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_messages_target_family_member_id_fkey"
            columns: ["target_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_contributions: {
        Row: {
          amount: number
          contributor_profile_id: string
          created_at: string
          id: string
          post_id: string
          reward_type: string
        }
        Insert: {
          amount: number
          contributor_profile_id: string
          created_at?: string
          id?: string
          post_id: string
          reward_type: string
        }
        Update: {
          amount?: number
          contributor_profile_id?: string
          created_at?: string
          id?: string
          post_id?: string
          reward_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_contributions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_tags: {
        Row: {
          created_at: string
          profile_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          email: string | null
          full_name: string
          full_name_hi: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          gotra: string | null
          id: string
          is_verified: boolean
          kuldevi: string | null
          kuldevta: string | null
          language: string | null
          mool_niwas: string | null
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
          vanshmala_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gotra?: string | null
          id?: string
          is_verified?: boolean
          kuldevi?: string | null
          kuldevta?: string | null
          language?: string | null
          mool_niwas?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
          vanshmala_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          full_name_hi?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gotra?: string | null
          id?: string
          is_verified?: boolean
          kuldevi?: string | null
          kuldevta?: string | null
          language?: string | null
          mool_niwas?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
          vanshmala_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_reward_given: boolean
          referred_user_id: string
          referrer_id: string
          referrer_reward_given: boolean
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_reward_given?: boolean
          referred_user_id: string
          referrer_id: string
          referrer_reward_given?: boolean
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_reward_given?: boolean
          referred_user_id?: string
          referrer_id?: string
          referrer_reward_given?: boolean
          status?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          tree_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          tree_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tree_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_comments: {
        Row: {
          comment: string
          created_at: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string | null
          description: string | null
          event_type: string | null
          family_member_id: string
          id: string
          media_urls: Json | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          event_type?: string | null
          family_member_id: string
          id?: string
          media_urls?: Json | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          event_type?: string | null
          family_member_id?: string
          id?: string
          media_urls?: Json | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_likes: {
        Row: {
          created_at: string
          event_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_link_requests: {
        Row: {
          admin_notes: string | null
          ai_confidence: number | null
          ai_reasoning: string | null
          ai_suggested_parent_id: string | null
          ai_suggested_relationship: string | null
          created_at: string
          full_name: string
          id: string
          relationship_claim: string | null
          requester_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_member_id: string | null
          tree_id: string
        }
        Insert: {
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          ai_suggested_parent_id?: string | null
          ai_suggested_relationship?: string | null
          created_at?: string
          full_name: string
          id?: string
          relationship_claim?: string | null
          requester_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_member_id?: string | null
          tree_id: string
        }
        Update: {
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          ai_suggested_parent_id?: string | null
          ai_suggested_relationship?: string | null
          created_at?: string
          full_name?: string
          id?: string
          relationship_claim?: string | null
          requester_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_member_id?: string | null
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_link_requests_ai_suggested_parent_id_fkey"
            columns: ["ai_suggested_parent_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_link_requests_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_link_requests_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          description_hi: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          description_hi?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          description_hi?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_feed_comment: {
        Args: { p_comment: string; p_post_id: string; p_profile_id: string }
        Returns: string
      }
      add_feed_like: {
        Args: { p_post_id: string; p_profile_id: string }
        Returns: undefined
      }
      check_feed_visibility: {
        Args: { author_id: string; viewer_id: string; vis: string }
        Returns: boolean
      }
      deduct_wallet_balance: {
        Args: {
          p_amount: number
          p_description: string
          p_description_hi: string
          p_reference_id: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      generate_vanshmala_id: { Args: never; Returns: string }
      get_or_create_share_token: {
        Args: { p_tree_id: string }
        Returns: string
      }
      get_profile_verification_status: {
        Args: { check_user_id: string }
        Returns: boolean
      }
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
      process_post_contribution: {
        Args: {
          p_contributor_profile_id: string
          p_post_id: string
          p_reward_type: string
        }
        Returns: undefined
      }
      process_referrer_reward: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      process_wallet_transfer: {
        Args: {
          p_amount: number
          p_recipient_user_id: string
          p_sender_name: string
          p_sender_vanshmala_id: string
        }
        Returns: undefined
      }
      redeem_gift_card: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      remove_feed_comment: {
        Args: { p_comment_id: string; p_post_id: string; p_profile_id: string }
        Returns: undefined
      }
      remove_feed_like: {
        Args: { p_post_id: string; p_profile_id: string }
        Returns: undefined
      }
      validate_discount_code: {
        Args: { p_amount: number; p_code: string; p_user_id: string }
        Returns: Json
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
