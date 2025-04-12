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
