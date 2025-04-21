-- Enable RLS on rcmds table
ALTER TABLE public.rcmds ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own RCMDs
CREATE POLICY "Users can read own RCMDs" ON public.rcmds
    FOR SELECT
    USING (owner_id = auth.uid() OR profile_id = auth.uid());

-- Create policy to allow users to insert their own RCMDs
CREATE POLICY "Users can insert own RCMDs" ON public.rcmds
    FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR profile_id = auth.uid());

-- Create policy to allow users to update their own RCMDs
CREATE POLICY "Users can update own RCMDs" ON public.rcmds
    FOR UPDATE
    USING (owner_id = auth.uid() OR profile_id = auth.uid());

-- Create policy to allow users to delete their own RCMDs
CREATE POLICY "Users can delete own RCMDs" ON public.rcmds
    FOR DELETE
    USING (owner_id = auth.uid() OR profile_id = auth.uid());

-- Create policy for public RCMDs visibility (if visibility is 'public')
CREATE POLICY "Public RCMDs are viewable by everyone" ON public.rcmds
    FOR SELECT
    USING (visibility = 'public');

-- The get_public_rcmds_for_profile function already exists and works with SECURITY DEFINER
-- to bypass RLS for public profile pages 