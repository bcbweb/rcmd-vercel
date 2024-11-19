import type { Business, RCMD } from "./index";
import type { Database } from "./supabase";

export type ProfileBlock =
	Database["public"]["Tables"]["profile_blocks"]["Row"] & {
		rcmd?: RCMD;
		business?: Business;
		content?: {
			type: "text" | "image" | "video" | "social";
			data: any;
		};
	};
