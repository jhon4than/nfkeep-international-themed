-- Add notifications_enabled field to users_public table
ALTER TABLE public.users_public 
ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;

-- Add first_visit field to track if user has completed initial setup
ALTER TABLE public.users_public 
ADD COLUMN first_visit BOOLEAN DEFAULT true;

-- Update existing users to have first_visit as true (they need to configure notifications)
UPDATE public.users_public 
SET first_visit = true 
WHERE first_visit IS NULL;

-- Create index for better performance on notifications queries
CREATE INDEX idx_users_public_notifications ON public.users_public(notifications_enabled);
CREATE INDEX idx_users_public_first_visit ON public.users_public(first_visit);

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_public (id, full_name, notifications_enabled, first_visit)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    false,
    true
  );
  RETURN NEW;
END;
$$;