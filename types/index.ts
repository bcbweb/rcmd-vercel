import type { Database } from "./supabase";

type Tables = Database["public"]["Tables"];

// Re-export common types with cleaner names
export type Profile = Tables["profiles"]["Row"];
export type Creator = Tables["creators"]["Row"];
export type Business = Tables["businesses"]["Row"];
export type RCMD = Tables["rcmds"]["Row"];
export type Link = Tables["links"]["Row"];
export type Collection = Tables["collections"]["Row"];
export type CollectionItem = Tables["collection_items"]["Row"];
export type ProfileBlockType = Tables["profile_blocks"]["Row"];
export type ProfilePage = Tables["profile_pages"]["Row"];
export type TextBlockType = Tables["text_blocks"]["Row"];
export type ImageBlockType = Tables["image_blocks"]["Row"];
export type LinkBlockType = Tables["link_blocks"]["Row"];
export type RCMDBlockType = Tables["rcmd_blocks"]["Row"];
export type CollectionBlockType = Tables["collection_blocks"]["Row"];

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

export interface CollectionWithItems extends Collection {
  collection_items?: Array<{
    id: string;
    collection_id: string;
    item_type: "rcmd" | "link";
    rcmd_id?: {
      id: string;
      [key: string]: any;
    };
    link_id?: {
      id: string;
      [key: string]: any;
    };
    created_at: string;
  }>;
}

// Enums (if you need them in your frontend)
export enum BusinessStatus {
  Pending = "pending",
  Active = "active",
  Suspended = "suspended",
  Closed = "closed",
}

export type RCMDType = Database["public"]["Enums"]["rcmd_type"];
export type RCMDVisibility = Database["public"]["Enums"]["rcmd_visibility"];
