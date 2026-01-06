-- Add display_order column to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set initial display_order based on created_at for existing collections
-- This ensures existing collections have a display_order value
UPDATE public.collections
SET display_order = sub.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY COALESCE(profile_id, owner_id) ORDER BY created_at DESC) as row_num
  FROM public.collections
) sub
WHERE public.collections.id = sub.id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON public.collections(profile_id, display_order);
CREATE INDEX IF NOT EXISTS idx_collections_display_order_owner ON public.collections(owner_id, display_order);

-- Create function to reorder collections
CREATE OR REPLACE FUNCTION public.reorder_collections(
  p_collection_id UUID,
  p_new_order INTEGER,
  p_profile_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_order INTEGER;
  v_auth_user_id TEXT;
BEGIN
  -- Get the authenticated user
  v_auth_user_id := auth.uid();
  
  -- Get current order of the collection being moved
  SELECT display_order INTO v_current_order
  FROM collections
  WHERE id = p_collection_id;
  
  IF v_current_order IS NULL THEN
    -- If display_order is NULL, set it to the max + 1 first
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO v_current_order
    FROM collections
    WHERE (
      (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
      (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
    );
    
    -- Update the collection with the calculated order
    UPDATE collections
    SET display_order = v_current_order
    WHERE id = p_collection_id;
  END IF;
  
  -- If moving to the same position, do nothing
  IF v_current_order = p_new_order THEN
    RETURN TRUE;
  END IF;
  
  -- Update other collections' display_order
  IF v_current_order < p_new_order THEN
    -- Moving down: shift items up
    UPDATE collections
    SET display_order = display_order - 1
    WHERE display_order > v_current_order 
      AND display_order <= p_new_order
      AND (
        (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
        (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
      )
      AND id != p_collection_id;
  ELSE
    -- Moving up: shift items down
    UPDATE collections
    SET display_order = display_order + 1
    WHERE display_order >= p_new_order 
      AND display_order < v_current_order
      AND (
        (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
        (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
      )
      AND id != p_collection_id;
  END IF;
  
  -- Update the moved collection's display_order
  UPDATE collections
  SET display_order = p_new_order,
      updated_at = now()
  WHERE id = p_collection_id;
  
  RETURN TRUE;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.reorder_collections IS 'Reorders collections by updating display_order values';

-- Create trigger function to set display_order for new collections
CREATE OR REPLACE FUNCTION public.set_collection_display_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  -- If display_order is not set, calculate it based on existing collections
  IF NEW.display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO v_max_order
    FROM collections
    WHERE (
      (NEW.profile_id IS NOT NULL AND profile_id = NEW.profile_id) OR
      (NEW.owner_id IS NOT NULL AND owner_id = NEW.owner_id)
    );
    
    NEW.display_order := v_max_order;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_collection_display_order ON public.collections;
CREATE TRIGGER trigger_set_collection_display_order
  BEFORE INSERT ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collection_display_order();

-- Add comment to the trigger function
COMMENT ON FUNCTION public.set_collection_display_order IS 'Automatically sets display_order for new collections';

