import type { Database } from "./supabase";

type Tables = Database["public"]["Tables"];

// Re-export common types with cleaner names
export type Profile = Tables["profiles"]["Row"];
export type Creator = Tables["creators"]["Row"];
export type Business = Tables["businesses"]["Row"];
export type RCMD = Tables["rcmds"]["Row"];
export type ProfileBlock = Tables["profile_blocks"]["Row"];
export type TextBlockType = Tables["text_blocks"]["Row"];

export enum TextAlignment {
	Left = "left",
	Center = "center",
	Right = "right",
}

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

// Enums (if you need them in your frontend)
export enum BusinessStatus {
	Pending = "pending",
	Active = "active",
	Suspended = "suspended",
	Closed = "closed",
}
