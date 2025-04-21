-- Create a migration for adding profile_id to links

ALTER TABLE public.links ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- Update the insert_link function to include profile_id
CREATE OR REPLACE FUNCTION public.insert_link(
    p_title text,
    p_url text,
    p_description text,
    p_type text,
    p_visibility text,
    p_profile_id uuid DEFAULT NULL
) RETURNS SETOF public.links
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user id
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Insert and return the new link
    RETURN QUERY
    INSERT INTO public.links(
        title,
        url,
        description,
        type,
        visibility,
        owner_id,
        profile_id
    ) VALUES (
        p_title,
        p_url,
        p_description,
        COALESCE(p_type, 'other'),
        COALESCE(p_visibility, 'private'),
        v_user_id,
        p_profile_id
    )
    RETURNING *;
END;
$$;
