-- Add is_disabled column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false NOT NULL;
