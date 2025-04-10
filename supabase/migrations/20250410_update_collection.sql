-- Create the update_collection RPC function
CREATE OR REPLACE FUNCTION update_collection(
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_visibility TEXT DEFAULT 'public'
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the collection
  UPDATE collections
  SET
    name = p_name,
    description = p_description,
    visibility = p_visibility::rcmd_visibility,
    updated_at = NOW()
  WHERE id = p_id;
  
  -- Return updated collection data
  SELECT row_to_json(c)::jsonb INTO result
  FROM collections c
  WHERE c.id = p_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
