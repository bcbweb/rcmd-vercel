-- Add display_order column to rcmds table
ALTER TABLE public.rcmds 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set initial display_order based on created_at for existing RCMDs
-- This ensures existing RCMDs have a display_order value
UPDATE public.rcmds
SET display_order = sub.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY COALESCE(profile_id, owner_id) ORDER BY created_at DESC) as row_num
  FROM public.rcmds
) sub
WHERE public.rcmds.id = sub.id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rcmds_display_order ON public.rcmds(profile_id, display_order);
CREATE INDEX IF NOT EXISTS idx_rcmds_display_order_owner ON public.rcmds(owner_id, display_order);

-- Create function to reorder RCMDs
CREATE OR REPLACE FUNCTION public.reorder_rcmds(
  p_rcmd_id UUID,
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
  
  -- Get current order of the RCMD being moved
  SELECT display_order INTO v_current_order
  FROM rcmds
  WHERE id = p_rcmd_id;
  
  IF v_current_order IS NULL THEN
    -- If display_order is NULL, set it to the max + 1 first
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO v_current_order
    FROM rcmds
    WHERE (
      (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
      (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
    );
    
    -- Update the RCMD with the calculated order
    UPDATE rcmds
    SET display_order = v_current_order
    WHERE id = p_rcmd_id;
  END IF;
  
  -- If moving to the same position, do nothing
  IF v_current_order = p_new_order THEN
    RETURN TRUE;
  END IF;
  
  -- Determine the filter condition for RCMDs belonging to the same user
  -- Update other RCMDs' display_order
  IF v_current_order < p_new_order THEN
    -- Moving down: shift items up
    UPDATE rcmds
    SET display_order = display_order - 1
    WHERE display_order > v_current_order 
      AND display_order <= p_new_order
      AND (
        (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
        (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
      )
      AND id != p_rcmd_id;
  ELSE
    -- Moving up: shift items down
    UPDATE rcmds
    SET display_order = display_order + 1
    WHERE display_order >= p_new_order 
      AND display_order < v_current_order
      AND (
        (p_profile_id IS NOT NULL AND profile_id = p_profile_id) OR
        (p_owner_id IS NOT NULL AND owner_id = p_owner_id)
      )
      AND id != p_rcmd_id;
  END IF;
  
  -- Update the moved RCMD's display_order
  UPDATE rcmds
  SET display_order = p_new_order,
      updated_at = now()
  WHERE id = p_rcmd_id;
  
  RETURN TRUE;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.reorder_rcmds IS 'Reorders RCMDs by updating display_order values';

-- Create trigger function to set display_order for new RCMDs
CREATE OR REPLACE FUNCTION public.set_rcmd_display_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  -- If display_order is not set, calculate it based on existing RCMDs
  IF NEW.display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO v_max_order
    FROM rcmds
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
DROP TRIGGER IF EXISTS trigger_set_rcmd_display_order ON public.rcmds;
CREATE TRIGGER trigger_set_rcmd_display_order
  BEFORE INSERT ON public.rcmds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_rcmd_display_order();

-- Add comment to the trigger function
COMMENT ON FUNCTION public.set_rcmd_display_order IS 'Automatically sets display_order for new RCMDs';

