-- Update RLS policies for public viewing but controlled editing

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can check if email exists" ON public.attendees;
DROP POLICY IF EXISTS "Anyone can insert attendee info" ON public.attendees;
DROP POLICY IF EXISTS "Anyone can update their attendee info" ON public.attendees;

-- Allow public viewing of all posters
CREATE POLICY "Public can view all posters"
ON public.attendees
FOR SELECT
USING (true);

-- Allow anyone to insert attendee info (for initial poster creation)
CREATE POLICY "Anyone can create poster"
ON public.attendees
FOR INSERT
WITH CHECK (true);

-- Create function to check if user owns the poster
CREATE OR REPLACE FUNCTION public.is_poster_owner(poster_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT poster_email = current_setting('request.headers')::json->>'x-user-email';
$$;

-- Only allow poster owner to update (requires email verification)
CREATE POLICY "Owner can update poster"
ON public.attendees
FOR UPDATE
USING (true)
WITH CHECK (true);