-- Enhance the get_public_collections_for_profile function to include complete RCMD data
CREATE OR REPLACE FUNCTION get_public_collections_for_profile(profile_id_param UUID)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH collection_data AS (
    SELECT
      c.id,
      c.name,
      c.description,
      c.visibility,
      c.profile_id,
      c.created_at,
      c.updated_at,
      -- Get collection items with complete RCMD data
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ci.id,
              'collection_id', ci.collection_id,
              'item_type', ci.item_type,
              'position', ci.position,
              'created_at', ci.created_at,
              'rcmd_id', ci.rcmd_id,
              'link_id', ci.link_id,
              -- Include the full RCMD object with all fields
              'rcmd', CASE 
                WHEN ci.item_type = 'rcmd' AND ci.rcmd_id IS NOT NULL THEN
                  (SELECT to_jsonb(r) FROM rcmds r WHERE r.id = ci.rcmd_id)
                ELSE NULL
              END,
              -- Include link data if it's a link item
              'links', CASE 
                WHEN ci.item_type = 'link' AND ci.link_id IS NOT NULL THEN
                  (SELECT to_jsonb(l) FROM links l WHERE l.id = ci.link_id)
                ELSE NULL
              END
            )
          )
          FROM collection_items ci
          WHERE ci.collection_id = c.id
        ),
        '[]'::jsonb
      ) AS items
    FROM
      collections c
    WHERE
      c.profile_id = profile_id_param
      AND c.visibility = 'public'
  )
  SELECT
    jsonb_build_object(
      'id', cd.id,
      'name', cd.name,
      'description', cd.description,
      'visibility', cd.visibility,
      'profile_id', cd.profile_id,
      'created_at', cd.created_at,
      'updated_at', cd.updated_at,
      'items', cd.items
    )
  FROM
    collection_data cd;
END;
$$;

-- Update the public collection blocks to properly render RCMDs
COMMENT ON FUNCTION get_public_collections_for_profile(UUID) IS 'Get all public collections for a profile with full RCMD data'; 