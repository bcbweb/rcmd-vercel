import type { Database } from "./supabase";

// Use schema types from Database
type PublicSchema = Database["public"];
type TableTypes = PublicSchema["Tables"];

// Re-export common types with cleaner names
export type Profile = TableTypes["profiles"]["Row"];
export type Creator = TableTypes["creators"]["Row"];
export type Business = TableTypes["businesses"]["Row"];
export type RCMD = TableTypes["rcmds"]["Row"];
export type Link = TableTypes["links"]["Row"];
export type Collection = TableTypes["collections"]["Row"];
export type CollectionItem = TableTypes["collection_items"]["Row"];
export type ProfileBlockType = TableTypes["profile_blocks"]["Row"];
export type ProfilePage = TableTypes["profile_pages"]["Row"];
export type TextBlockType = TableTypes["text_blocks"]["Row"];
export type ImageBlockType = TableTypes["image_blocks"]["Row"];
export type LinkBlockType = TableTypes["link_blocks"]["Row"];
export type RCMDBlockType = TableTypes["rcmd_blocks"]["Row"];
export type CollectionBlockType = TableTypes["collection_blocks"]["Row"];

// Custom composite types
export type CollectionBlockWithCollection = CollectionBlockType & {
  collection: Collection;
};

// You can also create custom composite types
export type BusinessWithOwner = Business & {
  owner: Profile;
};

export type RCMDWithCreator = RCMD & {
  creator: Creator;
};

// Custom utility types
export type WithTimestamps = {
  created_at: string;
  updated_at: string;
};

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  type?: string;
  url?: string;
}

// Extended types for Collection items with their related data
export interface EnhancedCollectionItem extends CollectionItem {
  // Old property names for backward compatibility
  rcmd?: RCMD | null;
  link?: Link | null;
  // New property names from updated query
  rcmds?: RCMD | null;
  links?: Link | null;
}

export interface CollectionWithItems extends Collection {
  collection_items?: EnhancedCollectionItem[];
}

// Enums (if you need them in your frontend)
export enum BusinessStatus {
  Pending = "pending",
  Active = "active",
  Suspended = "suspended",
  Closed = "closed",
}

export type RCMDType = PublicSchema["Enums"]["rcmd_type"];
export type RCMDVisibility = PublicSchema["Enums"]["rcmd_visibility"];

// Augmented types with additional properties - using type instead of interface to avoid conflicts
export type RCMDEntity = RCMD & {
  custom_profile_id?: string;
};

export type LinkEntity = Link & {
  custom_profile_id?: string;
};

export type CollectionEntity = Collection & {
  custom_profile_id?: string;
};
