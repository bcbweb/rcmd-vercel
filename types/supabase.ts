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
      business_claims: {
        Row: {
          business_id: string | null
          claimer_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          verification_documents: Json | null
        }
        Insert: {
          business_id?: string | null
          claimer_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          verification_documents?: Json | null
        }
        Update: {
          business_id?: string | null
          claimer_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          verification_documents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_claimer_id_fkey"
            columns: ["claimer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address: string
          business_id: string | null
          city: string
          coordinates: unknown | null
          country: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          business_id?: string | null
          city: string
          coordinates?: unknown | null
          country: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          business_id?: string | null
          city?: string
          coordinates?: unknown | null
          country?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string | null
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          media_urls: string[] | null
          rating: number
          reviewer_id: string | null
          status: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          media_urls?: string[] | null
          rating: number
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          media_urls?: string[] | null
          rating?: number
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_staff: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          attributes: Json | null
          business_registration_number: string | null
          categories: string[] | null
          commission_rate: number | null
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          operating_hours: Json | null
          owner_id: string | null
          payment_enabled: boolean | null
          phone: string | null
          photo_gallery: string[] | null
          primary_location: Json | null
          profile_picture_url: string | null
          rating_avg: number | null
          rating_count: number | null
          rcmd_count: number | null
          slug: string
          social_links: Json | null
          status: Database["public"]["Enums"]["business_status"] | null
          stripe_account_id: string | null
          tags: string[] | null
          tax_id: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string | null
          verification_documents: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          attributes?: Json | null
          business_registration_number?: string | null
          categories?: string[] | null
          commission_rate?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          owner_id?: string | null
          payment_enabled?: boolean | null
          phone?: string | null
          photo_gallery?: string[] | null
          primary_location?: Json | null
          profile_picture_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rcmd_count?: number | null
          slug: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["business_status"] | null
          stripe_account_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at?: string | null
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          attributes?: Json | null
          business_registration_number?: string | null
          categories?: string[] | null
          commission_rate?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          owner_id?: string | null
          payment_enabled?: boolean | null
          phone?: string | null
          photo_gallery?: string[] | null
          primary_location?: Json | null
          profile_picture_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rcmd_count?: number | null
          slug?: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["business_status"] | null
          stripe_account_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string | null
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      collection_blocks: {
        Row: {
          collection_id: string | null
          created_at: string | null
          id: string
          profile_block_id: string | null
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          profile_block_id?: string | null
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          profile_block_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_blocks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_blocks_profile_block_id_fkey"
            columns: ["profile_block_id"]
            isOneToOne: false
            referencedRelation: "profile_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_type: string
          link_id: string | null
          order_index: number
          rcmd_id: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_type: string
          link_id?: string | null
          order_index: number
          rcmd_id?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_type?: string
          link_id?: string | null
          order_index?: number
          rcmd_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Relationships: []
      }
      creator_followers: {
        Row: {
          created_at: string | null
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_followers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          application_date: string | null
          approved_at: string | null
          bio: string | null
          business_email: string | null
          category: string | null
          created_at: string | null
          handle: string | null
          id: string
          name: string | null
          owner_id: string
          profile_picture_url: string | null
          social_links: Json | null
          status: string | null
          stripe_account_id: string | null
          stripe_connected: boolean | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          application_date?: string | null
          approved_at?: string | null
          bio?: string | null
          business_email?: string | null
          category?: string | null
          created_at?: string | null
          handle?: string | null
          id: string
          name?: string | null
          owner_id: string
          profile_picture_url?: string | null
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          application_date?: string | null
          approved_at?: string | null
          bio?: string | null
          business_email?: string | null
          category?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          name?: string | null
          owner_id?: string
          profile_picture_url?: string | null
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      image_blocks: {
        Row: {
          auth_user_id: string
          caption: string | null
          created_at: string
          height: number | null
          id: string
          image_url: string
          mime_type: string
          original_filename: string
          profile_block_id: string
          size_bytes: number
          status: string | null
          updated_at: string
          uploaded_at: string | null
          width: number | null
        }
        Insert: {
          auth_user_id: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url: string
          mime_type: string
          original_filename: string
          profile_block_id: string
          size_bytes: number
          status?: string | null
          updated_at?: string
          uploaded_at?: string | null
          width?: number | null
        }
        Update: {
          auth_user_id?: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string
          mime_type?: string
          original_filename?: string
          profile_block_id?: string
          size_bytes?: number
          status?: string | null
          updated_at?: string
          uploaded_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_blocks_profile_block_id_fkey"
            columns: ["profile_block_id"]
            isOneToOne: false
            referencedRelation: "profile_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      link_blocks: {
        Row: {
          created_at: string
          id: string
          link_id: string
          profile_block_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_id: string
          profile_block_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string
          profile_block_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_blocks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_blocks_profile_block_id_fkey"
            columns: ["profile_block_id"]
            isOneToOne: false
            referencedRelation: "profile_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          click_count: number
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_sponsored: boolean
          like_count: number
          monetization_enabled: boolean
          owner_id: string
          save_count: number
          share_count: number
          status: string
          title: string
          type: string
          updated_at: string
          url: string
          view_count: number
          visibility: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_sponsored?: boolean
          like_count?: number
          monetization_enabled?: boolean
          owner_id: string
          save_count?: number
          share_count?: number
          status?: string
          title: string
          type?: string
          updated_at?: string
          url: string
          view_count?: number
          visibility?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_sponsored?: boolean
          like_count?: number
          monetization_enabled?: boolean
          owner_id?: string
          save_count?: number
          share_count?: number
          status?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_blocks: {
        Row: {
          auth_user_id: string
          created_at: string | null
          display_order: number
          id: string
          page_id: string
          profile_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          display_order: number
          id?: string
          page_id: string
          profile_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          page_id?: string
          profile_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "profile_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_pages: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          owner_id: string
          profile_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          owner_id: string
          profile_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          owner_id?: string
          profile_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_pages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_social_links: {
        Row: {
          created_at: string | null
          handle: string
          id: string
          is_verified: boolean | null
          platform: Database["public"]["Enums"]["social_platform_type"]
          profile_id: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          handle: string
          id?: string
          is_verified?: boolean | null
          platform: Database["public"]["Enums"]["social_platform_type"]
          profile_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          handle?: string
          id?: string
          is_verified?: boolean | null
          platform?: Database["public"]["Enums"]["social_platform_type"]
          profile_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_social_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          bio: string | null
          cover_image: string | null
          created_at: string | null
          default_page_id: string | null
          email: string
          first_name: string | null
          handle: string | null
          id: string
          interests: string[] | null
          is_onboarded: boolean | null
          last_name: string | null
          location: string | null
          profile_picture_url: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          bio?: string | null
          cover_image?: string | null
          created_at?: string | null
          default_page_id?: string | null
          email: string
          first_name?: string | null
          handle?: string | null
          id?: string
          interests?: string[] | null
          is_onboarded?: boolean | null
          last_name?: string | null
          location?: string | null
          profile_picture_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          bio?: string | null
          cover_image?: string | null
          created_at?: string | null
          default_page_id?: string | null
          email?: string
          first_name?: string | null
          handle?: string | null
          id?: string
          interests?: string[] | null
          is_onboarded?: boolean | null
          last_name?: string | null
          location?: string | null
          profile_picture_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_page_id_fkey"
            columns: ["default_page_id"]
            isOneToOne: false
            referencedRelation: "profile_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmd_blocks: {
        Row: {
          created_at: string
          id: string
          profile_block_id: string
          rcmd_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_block_id: string
          rcmd_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_block_id?: string
          rcmd_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcmd_blocks_profile_block_id_fkey"
            columns: ["profile_block_id"]
            isOneToOne: false
            referencedRelation: "profile_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcmd_blocks_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmd_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          rcmd_id: string | null
          status: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          rcmd_id?: string | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          rcmd_id?: string | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rcmd_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "rcmd_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcmd_comments_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcmd_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmd_likes: {
        Row: {
          created_at: string | null
          rcmd_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          rcmd_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          rcmd_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcmd_likes_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcmd_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmd_saves: {
        Row: {
          collection_id: string | null
          created_at: string | null
          rcmd_id: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          rcmd_id: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          rcmd_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcmd_saves_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmd_views: {
        Row: {
          id: string
          rcmd_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          rcmd_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          rcmd_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rcmd_views_rcmd_id_fkey"
            columns: ["rcmd_id"]
            isOneToOne: false
            referencedRelation: "rcmds"
            referencedColumns: ["id"]
          },
        ]
      }
      rcmds: {
        Row: {
          click_count: number
          commission_rate: number | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          featured_image: string | null
          id: string
          is_sponsored: boolean | null
          like_count: number
          location: Json | null
          metadata: Json | null
          monetization_enabled: boolean | null
          owner_id: string | null
          price_range: Json | null
          save_count: number | null
          share_count: number
          sponsor_details: Json | null
          status: Database["public"]["Enums"]["rcmd_status"] | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["rcmd_type"]
          updated_at: string | null
          url: string | null
          view_count: number
          visibility: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Insert: {
          click_count?: number
          commission_rate?: number | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          featured_image?: string | null
          id?: string
          is_sponsored?: boolean | null
          like_count?: number
          location?: Json | null
          metadata?: Json | null
          monetization_enabled?: boolean | null
          owner_id?: string | null
          price_range?: Json | null
          save_count?: number | null
          share_count?: number
          sponsor_details?: Json | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["rcmd_type"]
          updated_at?: string | null
          url?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Update: {
          click_count?: number
          commission_rate?: number | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          featured_image?: string | null
          id?: string
          is_sponsored?: boolean | null
          like_count?: number
          location?: Json | null
          metadata?: Json | null
          monetization_enabled?: boolean | null
          owner_id?: string | null
          price_range?: Json | null
          save_count?: number | null
          share_count?: number
          sponsor_details?: Json | null
          status?: Database["public"]["Enums"]["rcmd_status"] | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["rcmd_type"]
          updated_at?: string | null
          url?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rcmds_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      text_blocks: {
        Row: {
          created_at: string | null
          id: string
          profile_block_id: string | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_block_id?: string | null
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_block_id?: string | null
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "text_blocks_profile_block_id_fkey"
            columns: ["profile_block_id"]
            isOneToOne: false
            referencedRelation: "profile_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_block_with_order: {
        Args: {
          p_profile_id: string
          p_content: Json
          p_type: string
        }
        Returns: {
          auth_user_id: string
          created_at: string | null
          display_order: number
          id: string
          page_id: string
          profile_id: string | null
          type: string
          updated_at: string | null
        }
      }
      insert_collection: {
        Args: {
          payload: Json
        }
        Returns: Json
      }
      insert_collection_block: {
        Args: {
          p_profile_id: string
          p_collection_id: string
        }
        Returns: undefined
      }
      insert_image_block: {
        Args: {
          p_profile_id: string
          p_image_url: string
          p_caption: string
          p_original_filename: string
          p_size_bytes: number
          p_mime_type: string
          p_width: number
          p_height: number
        }
        Returns: undefined
      }
      insert_link: {
        Args: {
          p_title: string
          p_url: string
          p_description: string
          p_type: string
          p_visibility: string
        }
        Returns: {
          id: string
          created_at: string
          title: string
          url: string
          description: string
          type: string
          visibility: string
          owner_id: string
        }[]
      }
      insert_link_block: {
        Args: {
          p_profile_id: string
          p_link_id: string
        }
        Returns: undefined
      }
      insert_profile_page: {
        Args: {
          page_name: string
          page_slug: string
        }
        Returns: string
      }
      insert_rcmd:
        | {
            Args: {
              p_title: string
              p_description: string
              p_type: string
              p_visibility: string
              p_featured_image: string
            }
            Returns: {
              id: string
              created_at: string
              title: string
              description: string
              type: Database["public"]["Enums"]["rcmd_type"]
              visibility: Database["public"]["Enums"]["rcmd_visibility"]
              owner_id: string
              featured_image: string
            }[]
          }
        | {
            Args: {
              p_title: string
              p_description: string
              p_type: string
              p_visibility: string
              p_featured_image?: string
              p_tags?: string[]
            }
            Returns: {
              id: string
              created_at: string
              title: string
              description: string
              type: Database["public"]["Enums"]["rcmd_type"]
              visibility: Database["public"]["Enums"]["rcmd_visibility"]
              owner_id: string
              featured_image: string
              tags: string[]
            }[]
          }
        | {
            Args: {
              p_title: string
              p_description: string
              p_type: string
              p_visibility: string
              p_featured_image?: string
              p_tags?: string[]
              p_url?: string
            }
            Returns: {
              id: string
              created_at: string
              title: string
              description: string
              type: Database["public"]["Enums"]["rcmd_type"]
              visibility: Database["public"]["Enums"]["rcmd_visibility"]
              owner_id: string
              featured_image: string
              tags: string[]
              url: string
            }[]
          }
      insert_rcmd_block: {
        Args: {
          p_profile_id: string
          p_rcmd_id: string
        }
        Returns: {
          auth_user_id: string
          created_at: string | null
          display_order: number
          id: string
          page_id: string
          profile_id: string | null
          type: string
          updated_at: string | null
        }
      }
      insert_text_block: {
        Args: {
          p_profile_id: string
          p_text: string
        }
        Returns: {
          auth_user_id: string
          created_at: string | null
          display_order: number
          id: string
          page_id: string
          profile_id: string | null
          type: string
          updated_at: string | null
        }
      }
      next_block_order: {
        Args: {
          p_profile_id: string
        }
        Returns: number
      }
      reorder_profile_blocks: {
        Args: {
          p_profile_id: string
          p_block_id: string
          p_new_order: number
        }
        Returns: boolean
      }
      toggle_rcmd_like: {
        Args: {
          rcmd_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      business_status: "pending" | "active" | "suspended" | "closed"
      business_type:
        | "retail"
        | "restaurant"
        | "service"
        | "entertainment"
        | "accommodation"
        | "other"
      rcmd_status: "draft" | "active" | "archived" | "flagged" | "deleted"
      rcmd_type: "product" | "service" | "place" | "experience" | "other"
      rcmd_visibility: "public" | "private" | "followers"
      social_platform_type:
        | "instagram"
        | "twitter"
        | "youtube"
        | "tiktok"
        | "linkedin"
        | "facebook"
      text_alignment: "left" | "center" | "right"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
