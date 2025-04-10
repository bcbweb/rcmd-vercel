-- Create the update_collection_items RPC function
CREATE OR REPLACE FUNCTION update_collection_items(
  p_collection_id UUID,
  p_rcmd_ids UUID[],
  p_link_ids UUID[] DEFAULT '{}'::UUID[]
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Delete existing collection items for the collection
  DELETE FROM collection_items WHERE collection_id = p_collection_id;
  
  -- Insert RCMD items
  WITH inserted_rcmds AS (
    INSERT INTO collection_items (
      collection_id,
      item_type,
      rcmd_id,
      link_id,
      order_index
    )
    SELECT 
      p_collection_id,
      'rcmd',
      rcmd_id,
      NULL,
      row_number() OVER () - 1
    FROM unnest(p_rcmd_ids) AS rcmd_id
    WHERE rcmd_id IS NOT NULL
    RETURNING id
  )
  SELECT json_agg(id) INTO result FROM inserted_rcmds;
  
  -- Prepare result JSON with rcmd_ids
  result := jsonb_build_object('rcmd_items', result);
  
  -- Insert Link items
  WITH inserted_links AS (
    INSERT INTO collection_items (
      collection_id,
      item_type,
      rcmd_id,
      link_id,
      order_index
    )
    SELECT 
      p_collection_id,
      'link',
      NULL,
      link_id,
      row_number() OVER () + (SELECT COUNT(*) FROM collection_items WHERE collection_id = p_collection_id) - 1
    FROM unnest(p_link_ids) AS link_id
    WHERE link_id IS NOT NULL
    RETURNING id
  )
  SELECT json_agg(id) INTO result FROM inserted_links;
  
  -- Add link_items to result
  result := result || jsonb_build_object('link_items', result);
  
  -- Add summary information
  result := result || jsonb_build_object(
    'total_items', (SELECT COUNT(*) FROM collection_items WHERE collection_id = p_collection_id),
    'collection_id', p_collection_id
  );
  
  -- Update collection updated_at timestamp
  UPDATE collections SET updated_at = NOW() WHERE id = p_collection_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 