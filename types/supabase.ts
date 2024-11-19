export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			business_claims: {
				Row: {
					business_id: string | null;
					claimer_id: string | null;
					created_at: string | null;
					id: string;
					notes: string | null;
					reviewed_at: string | null;
					reviewed_by: string | null;
					status: string | null;
					updated_at: string | null;
					verification_documents: Json | null;
				};
				Insert: {
					business_id?: string | null;
					claimer_id?: string | null;
					created_at?: string | null;
					id?: string;
					notes?: string | null;
					reviewed_at?: string | null;
					reviewed_by?: string | null;
					status?: string | null;
					updated_at?: string | null;
					verification_documents?: Json | null;
				};
				Update: {
					business_id?: string | null;
					claimer_id?: string | null;
					created_at?: string | null;
					id?: string;
					notes?: string | null;
					reviewed_at?: string | null;
					reviewed_by?: string | null;
					status?: string | null;
					updated_at?: string | null;
					verification_documents?: Json | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_claims_business_id_fkey";
						columns: ["business_id"];
						isOneToOne: false;
						referencedRelation: "businesses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "business_claims_claimer_id_fkey";
						columns: ["claimer_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "business_claims_reviewed_by_fkey";
						columns: ["reviewed_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			business_locations: {
				Row: {
					address: string;
					business_id: string | null;
					city: string;
					coordinates: unknown | null;
					country: string;
					created_at: string | null;
					email: string | null;
					id: string;
					is_primary: boolean | null;
					name: string;
					operating_hours: Json | null;
					phone: string | null;
					postal_code: string | null;
					state: string | null;
					status: Database["public"]["Enums"]["business_status"] | null;
					updated_at: string | null;
				};
				Insert: {
					address: string;
					business_id?: string | null;
					city: string;
					coordinates?: unknown | null;
					country: string;
					created_at?: string | null;
					email?: string | null;
					id?: string;
					is_primary?: boolean | null;
					name: string;
					operating_hours?: Json | null;
					phone?: string | null;
					postal_code?: string | null;
					state?: string | null;
					status?: Database["public"]["Enums"]["business_status"] | null;
					updated_at?: string | null;
				};
				Update: {
					address?: string;
					business_id?: string | null;
					city?: string;
					coordinates?: unknown | null;
					country?: string;
					created_at?: string | null;
					email?: string | null;
					id?: string;
					is_primary?: boolean | null;
					name?: string;
					operating_hours?: Json | null;
					phone?: string | null;
					postal_code?: string | null;
					state?: string | null;
					status?: Database["public"]["Enums"]["business_status"] | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_locations_business_id_fkey";
						columns: ["business_id"];
						isOneToOne: false;
						referencedRelation: "businesses";
						referencedColumns: ["id"];
					},
				];
			};
			business_reviews: {
				Row: {
					business_id: string | null;
					content: string | null;
					created_at: string | null;
					helpful_count: number | null;
					id: string;
					media_urls: string[] | null;
					rating: number;
					reviewer_id: string | null;
					status: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at: string | null;
				};
				Insert: {
					business_id?: string | null;
					content?: string | null;
					created_at?: string | null;
					helpful_count?: number | null;
					id?: string;
					media_urls?: string[] | null;
					rating: number;
					reviewer_id?: string | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at?: string | null;
				};
				Update: {
					business_id?: string | null;
					content?: string | null;
					created_at?: string | null;
					helpful_count?: number | null;
					id?: string;
					media_urls?: string[] | null;
					rating?: number;
					reviewer_id?: string | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_reviews_business_id_fkey";
						columns: ["business_id"];
						isOneToOne: false;
						referencedRelation: "businesses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "business_reviews_reviewer_id_fkey";
						columns: ["reviewer_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			business_staff: {
				Row: {
					business_id: string | null;
					created_at: string | null;
					id: string;
					permissions: Json | null;
					role: string;
					status: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					business_id?: string | null;
					created_at?: string | null;
					id?: string;
					permissions?: Json | null;
					role: string;
					status?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					business_id?: string | null;
					created_at?: string | null;
					id?: string;
					permissions?: Json | null;
					role?: string;
					status?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_staff_business_id_fkey";
						columns: ["business_id"];
						isOneToOne: false;
						referencedRelation: "businesses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "business_staff_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			businesses: {
				Row: {
					attributes: Json | null;
					business_registration_number: string | null;
					categories: string[] | null;
					commission_rate: number | null;
					cover_photo_url: string | null;
					created_at: string | null;
					description: string | null;
					email: string | null;
					id: string;
					logo_url: string | null;
					name: string;
					operating_hours: Json | null;
					owner_id: string | null;
					payment_enabled: boolean | null;
					phone: string | null;
					photo_gallery: string[] | null;
					primary_location: Json;
					rating_avg: number | null;
					rating_count: number | null;
					rcmd_count: number | null;
					slug: string;
					social_links: Json | null;
					status: Database["public"]["Enums"]["business_status"] | null;
					stripe_account_id: string | null;
					tags: string[] | null;
					tax_id: string | null;
					type: Database["public"]["Enums"]["business_type"];
					updated_at: string | null;
					verification_documents: Json | null;
					verification_status:
						| Database["public"]["Enums"]["verification_status"]
						| null;
					verified_at: string | null;
					view_count: number | null;
					website: string | null;
				};
				Insert: {
					attributes?: Json | null;
					business_registration_number?: string | null;
					categories?: string[] | null;
					commission_rate?: number | null;
					cover_photo_url?: string | null;
					created_at?: string | null;
					description?: string | null;
					email?: string | null;
					id?: string;
					logo_url?: string | null;
					name: string;
					operating_hours?: Json | null;
					owner_id?: string | null;
					payment_enabled?: boolean | null;
					phone?: string | null;
					photo_gallery?: string[] | null;
					primary_location: Json;
					rating_avg?: number | null;
					rating_count?: number | null;
					rcmd_count?: number | null;
					slug: string;
					social_links?: Json | null;
					status?: Database["public"]["Enums"]["business_status"] | null;
					stripe_account_id?: string | null;
					tags?: string[] | null;
					tax_id?: string | null;
					type: Database["public"]["Enums"]["business_type"];
					updated_at?: string | null;
					verification_documents?: Json | null;
					verification_status?:
						| Database["public"]["Enums"]["verification_status"]
						| null;
					verified_at?: string | null;
					view_count?: number | null;
					website?: string | null;
				};
				Update: {
					attributes?: Json | null;
					business_registration_number?: string | null;
					categories?: string[] | null;
					commission_rate?: number | null;
					cover_photo_url?: string | null;
					created_at?: string | null;
					description?: string | null;
					email?: string | null;
					id?: string;
					logo_url?: string | null;
					name?: string;
					operating_hours?: Json | null;
					owner_id?: string | null;
					payment_enabled?: boolean | null;
					phone?: string | null;
					photo_gallery?: string[] | null;
					primary_location?: Json;
					rating_avg?: number | null;
					rating_count?: number | null;
					rcmd_count?: number | null;
					slug?: string;
					social_links?: Json | null;
					status?: Database["public"]["Enums"]["business_status"] | null;
					stripe_account_id?: string | null;
					tags?: string[] | null;
					tax_id?: string | null;
					type?: Database["public"]["Enums"]["business_type"];
					updated_at?: string | null;
					verification_documents?: Json | null;
					verification_status?:
						| Database["public"]["Enums"]["verification_status"]
						| null;
					verified_at?: string | null;
					view_count?: number | null;
					website?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "businesses_owner_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			collections: {
				Row: {
					created_at: string | null;
					description: string | null;
					id: string;
					name: string;
					owner_id: string | null;
					updated_at: string | null;
					visibility: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Insert: {
					created_at?: string | null;
					description?: string | null;
					id?: string;
					name: string;
					owner_id?: string | null;
					updated_at?: string | null;
					visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Update: {
					created_at?: string | null;
					description?: string | null;
					id?: string;
					name?: string;
					owner_id?: string | null;
					updated_at?: string | null;
					visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Relationships: [
					{
						foreignKeyName: "collections_owner_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			creator_followers: {
				Row: {
					created_at: string | null;
					creator_id: string;
					follower_id: string;
				};
				Insert: {
					created_at?: string | null;
					creator_id: string;
					follower_id: string;
				};
				Update: {
					created_at?: string | null;
					creator_id?: string;
					follower_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "creator_followers_creator_id_fkey";
						columns: ["creator_id"];
						isOneToOne: false;
						referencedRelation: "creators";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "creator_followers_follower_id_fkey";
						columns: ["follower_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			creators: {
				Row: {
					application_date: string | null;
					approved_at: string | null;
					business_email: string | null;
					category: string | null;
					id: string;
					social_links: Json | null;
					status: string | null;
					stripe_account_id: string | null;
					stripe_connected: boolean | null;
					verified: boolean | null;
					website: string | null;
				};
				Insert: {
					application_date?: string | null;
					approved_at?: string | null;
					business_email?: string | null;
					category?: string | null;
					id: string;
					social_links?: Json | null;
					status?: string | null;
					stripe_account_id?: string | null;
					stripe_connected?: boolean | null;
					verified?: boolean | null;
					website?: string | null;
				};
				Update: {
					application_date?: string | null;
					approved_at?: string | null;
					business_email?: string | null;
					category?: string | null;
					id?: string;
					social_links?: Json | null;
					status?: string | null;
					stripe_account_id?: string | null;
					stripe_connected?: boolean | null;
					verified?: boolean | null;
					website?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "creators_id_fkey";
						columns: ["id"];
						isOneToOne: true;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			profile_blocks: {
				Row: {
					business_id: string | null;
					content: Json | null;
					created_at: string | null;
					id: string;
					order: number;
					profile_id: string | null;
					rcmd_id: string | null;
					text_block_id: string | null;
					type: string;
					updated_at: string | null;
				};
				Insert: {
					business_id?: string | null;
					content?: Json | null;
					created_at?: string | null;
					id?: string;
					order: number;
					profile_id?: string | null;
					rcmd_id?: string | null;
					text_block_id?: string | null;
					type: string;
					updated_at?: string | null;
				};
				Update: {
					business_id?: string | null;
					content?: Json | null;
					created_at?: string | null;
					id?: string;
					order?: number;
					profile_id?: string | null;
					rcmd_id?: string | null;
					text_block_id?: string | null;
					type?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "profile_blocks_business_id_fkey";
						columns: ["business_id"];
						isOneToOne: false;
						referencedRelation: "businesses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profile_blocks_profile_id_fkey";
						columns: ["profile_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profile_blocks_rcmd_id_fkey";
						columns: ["rcmd_id"];
						isOneToOne: false;
						referencedRelation: "rcmds";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profile_blocks_text_block_id_fkey";
						columns: ["text_block_id"];
						isOneToOne: false;
						referencedRelation: "text_blocks";
						referencedColumns: ["id"];
					},
				];
			};
			profiles: {
				Row: {
					bio: string | null;
					created_at: string | null;
					first_name: string | null;
					id: string;
					last_name: string | null;
					location: string | null;
					profile_picture: string | null;
					updated_at: string | null;
					url_handle: string | null;
					username: string | null;
				};
				Insert: {
					bio?: string | null;
					created_at?: string | null;
					first_name?: string | null;
					id: string;
					last_name?: string | null;
					location?: string | null;
					profile_picture?: string | null;
					updated_at?: string | null;
					url_handle?: string | null;
					username?: string | null;
				};
				Update: {
					bio?: string | null;
					created_at?: string | null;
					first_name?: string | null;
					id?: string;
					last_name?: string | null;
					location?: string | null;
					profile_picture?: string | null;
					updated_at?: string | null;
					url_handle?: string | null;
					username?: string | null;
				};
				Relationships: [];
			};
			rcmd_comments: {
				Row: {
					content: string;
					created_at: string | null;
					id: string;
					parent_id: string | null;
					rcmd_id: string | null;
					status: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					content: string;
					created_at?: string | null;
					id?: string;
					parent_id?: string | null;
					rcmd_id?: string | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					content?: string;
					created_at?: string | null;
					id?: string;
					parent_id?: string | null;
					rcmd_id?: string | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "rcmd_comments_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "rcmd_comments";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmd_comments_rcmd_id_fkey";
						columns: ["rcmd_id"];
						isOneToOne: false;
						referencedRelation: "rcmds";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmd_comments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			rcmd_likes: {
				Row: {
					created_at: string | null;
					rcmd_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					rcmd_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					rcmd_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "rcmd_likes_rcmd_id_fkey";
						columns: ["rcmd_id"];
						isOneToOne: false;
						referencedRelation: "rcmds";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmd_likes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			rcmd_saves: {
				Row: {
					collection_id: string | null;
					created_at: string | null;
					rcmd_id: string;
					user_id: string;
				};
				Insert: {
					collection_id?: string | null;
					created_at?: string | null;
					rcmd_id: string;
					user_id: string;
				};
				Update: {
					collection_id?: string | null;
					created_at?: string | null;
					rcmd_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "rcmd_saves_rcmd_id_fkey";
						columns: ["rcmd_id"];
						isOneToOne: false;
						referencedRelation: "rcmds";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmd_saves_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			rcmd_views: {
				Row: {
					id: string;
					rcmd_id: string | null;
					user_id: string | null;
					viewed_at: string | null;
				};
				Insert: {
					id?: string;
					rcmd_id?: string | null;
					user_id?: string | null;
					viewed_at?: string | null;
				};
				Update: {
					id?: string;
					rcmd_id?: string | null;
					user_id?: string | null;
					viewed_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "rcmd_views_rcmd_id_fkey";
						columns: ["rcmd_id"];
						isOneToOne: false;
						referencedRelation: "rcmds";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmd_views_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			rcmds: {
				Row: {
					commission_rate: number | null;
					created_at: string | null;
					creator_id: string | null;
					description: string | null;
					featured_image: string | null;
					id: string;
					is_sponsored: boolean | null;
					like_count: number | null;
					location: Json | null;
					metadata: Json | null;
					monetization_enabled: boolean | null;
					owner_id: string | null;
					price_range: Json | null;
					save_count: number | null;
					share_count: number | null;
					sponsor_details: Json | null;
					status: Database["public"]["Enums"]["rcmd_status"] | null;
					tags: string[] | null;
					title: string;
					type: Database["public"]["Enums"]["rcmd_type"];
					updated_at: string | null;
					url: string | null;
					view_count: number | null;
					visibility: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Insert: {
					commission_rate?: number | null;
					created_at?: string | null;
					creator_id?: string | null;
					description?: string | null;
					featured_image?: string | null;
					id?: string;
					is_sponsored?: boolean | null;
					like_count?: number | null;
					location?: Json | null;
					metadata?: Json | null;
					monetization_enabled?: boolean | null;
					owner_id?: string | null;
					price_range?: Json | null;
					save_count?: number | null;
					share_count?: number | null;
					sponsor_details?: Json | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					tags?: string[] | null;
					title: string;
					type: Database["public"]["Enums"]["rcmd_type"];
					updated_at?: string | null;
					url?: string | null;
					view_count?: number | null;
					visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Update: {
					commission_rate?: number | null;
					created_at?: string | null;
					creator_id?: string | null;
					description?: string | null;
					featured_image?: string | null;
					id?: string;
					is_sponsored?: boolean | null;
					like_count?: number | null;
					location?: Json | null;
					metadata?: Json | null;
					monetization_enabled?: boolean | null;
					owner_id?: string | null;
					price_range?: Json | null;
					save_count?: number | null;
					share_count?: number | null;
					sponsor_details?: Json | null;
					status?: Database["public"]["Enums"]["rcmd_status"] | null;
					tags?: string[] | null;
					title?: string;
					type?: Database["public"]["Enums"]["rcmd_type"];
					updated_at?: string | null;
					url?: string | null;
					view_count?: number | null;
					visibility?: Database["public"]["Enums"]["rcmd_visibility"] | null;
				};
				Relationships: [
					{
						foreignKeyName: "rcmds_creator_id_fkey";
						columns: ["creator_id"];
						isOneToOne: false;
						referencedRelation: "creators";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "rcmds_owner_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			text_blocks: {
				Row: {
					alignment: Database["public"]["Enums"]["text_alignment"] | null;
					created_at: string | null;
					id: string;
					profile_block_id: string | null;
					text: string;
					updated_at: string | null;
				};
				Insert: {
					alignment?: Database["public"]["Enums"]["text_alignment"] | null;
					created_at?: string | null;
					id?: string;
					profile_block_id?: string | null;
					text: string;
					updated_at?: string | null;
				};
				Update: {
					alignment?: Database["public"]["Enums"]["text_alignment"] | null;
					created_at?: string | null;
					id?: string;
					profile_block_id?: string | null;
					text?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "text_blocks_profile_block_id_fkey";
						columns: ["profile_block_id"];
						isOneToOne: false;
						referencedRelation: "profile_blocks";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			toggle_rcmd_like: {
				Args: {
					rcmd_id: string;
				};
				Returns: boolean;
			};
		};
		Enums: {
			business_status: "pending" | "active" | "suspended" | "closed";
			business_type:
				| "retail"
				| "restaurant"
				| "service"
				| "entertainment"
				| "accommodation"
				| "other";
			rcmd_status: "draft" | "active" | "archived" | "flagged" | "deleted";
			rcmd_type: "product" | "service" | "place" | "experience" | "content";
			rcmd_visibility: "public" | "private" | "followers";
			text_alignment: "left" | "center" | "right";
			verification_status: "unverified" | "pending" | "verified" | "rejected";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
				PublicSchema["Views"])
		? (PublicSchema["Tables"] &
				PublicSchema["Views"])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

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
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof PublicSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
		? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;
