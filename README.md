## RCMD Block Error Fix

If you encounter an error when adding RCMD blocks with messages like:

```
Error: Searched for the function public.insert_rcmd_block, but no matches were found in the schema cache.
```

or

```
Could not find the function public.insert_rcmd_block(p_page_id, p_profile_id, p_rcmd_id) in the schema cache
```

Follow these steps to fix it:

1. Ensure you have at least one page created for your profile
2. Go to the Supabase dashboard for your project
3. Open the SQL Editor
4. Copy the contents of `supabase/migrations/20240711_insert_rcmd_block.sql`
5. Paste and run the SQL in the editor
6. The error should now be resolved

The key improvements in the updated function include:

- Proper handling of page_id (automatically finds the first page)
- Correct parameter ordering (p_profile_id, p_rcmd_id) without p_page_id parameter
- Explicit setting of auth_user_id from the authenticated user
- Simpler display order calculation
- Better error handling with clear error messages

### Important Note on Parameters

The RPC function `insert_rcmd_block` requires exactly two parameters in this order:

1. `p_profile_id` - The profile ID
2. `p_rcmd_id` - The RCMD ID to add

The page_id is determined internally by the function by selecting the first page associated with the profile.

## Short URLs for RCMDs

RCMDs now support short, shareable URLs using a compact ID format. Instead of using the full UUID in the URL, we use a compressed format that's more user-friendly.

### Example:

Original UUID: `123e4567-e89b-12d3-a456-426614174000`  
Short URL: `/rcmd/4gEjWTfqB7`

### How it works:

1. The system encodes UUIDs to a base62 format for URL-friendly, shorter IDs
2. RCMDs are accessible via `/rcmd/[shortId]` routes
3. All RCMDCard components automatically use the short format when linking to RCMDs

### Implementation:

- Utility functions are in `lib/utils/short-id.ts`
- Main RCMD page is implemented at `app/rcmd/[id]/page.tsx`
- RCMDCard component in carousel uses the short link format

### Usage:

```jsx
import { getRCMDShortLink } from "@/components/features/rcmd/rcmd-link";

// Generate a short link URL from a RCMD's UUID
const shortLink = getRCMDShortLink(rcmd.id);
```

You can also use the RCMDLink component to generate links to RCMDs:

```jsx
import { RCMDLink } from "@/components/features/rcmd/rcmd-link";

// In your component
<RCMDLink rcmd={rcmd} className="hover:underline">
  View this RCMD
</RCMDLink>;
```
