import { RCMD } from "@/types";
import { createClient } from "@/utils/supabase/client";

/**
 * Fetch a single RCMD by its UUID
 */
export async function fetchRCMDById(id: string): Promise<RCMD | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rcmds")
    .select(
      `
      *,
      profiles:profile_id (
        id,
        handle,
        first_name, 
        last_name,
        profile_picture_url
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching RCMD:", error);
    return null;
  }

  return data as RCMD;
}

/**
 * Fetch public RCMDs with optional pagination
 */
export async function fetchPublicRCMDs(page = 1, limit = 10): Promise<RCMD[]> {
  const supabase = createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("rcmds")
    .select(
      `
      *,
      profiles:profile_id (
        id,
        handle,
        first_name, 
        last_name,
        profile_picture_url
      )
    `
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching public RCMDs:", error);
    return [];
  }

  return data as RCMD[];
}
