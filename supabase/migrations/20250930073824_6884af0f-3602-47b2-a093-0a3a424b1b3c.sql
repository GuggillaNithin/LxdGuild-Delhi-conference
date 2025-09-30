-- Create attendees table
CREATE TABLE public.attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  headshot_url TEXT,
  registered BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Create policies - public read access for email verification, update allowed for all
CREATE POLICY "Anyone can check if email exists"
ON public.attendees
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their attendee info"
ON public.attendees
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can insert attendee info"
ON public.attendees
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for headshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true);

-- Storage policies for headshots
CREATE POLICY "Anyone can upload headshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'headshots');

CREATE POLICY "Headshots are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'headshots');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_attendees_updated_at
BEFORE UPDATE ON public.attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();