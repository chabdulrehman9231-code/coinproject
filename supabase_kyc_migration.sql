-- 1. Add kyc_status column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified' NOT NULL;

-- 2. Create public.kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  country text NOT NULL,
  id_number text NOT NULL,
  address text NOT NULL,
  document_type text NOT NULL, -- 'National ID', 'Passport', 'License'
  front_image_url text NOT NULL,
  back_image_url text NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
  rejection_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on kyc_submissions
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for users to manage their KYC submissions
CREATE POLICY "Users can view their own KYC submissions." ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC submissions." ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', true) 
ON CONFLICT DO NOTHING;

-- 6. Storage access policies for kyc_documents bucket
CREATE POLICY "Public Read KYC Docs" ON storage.objects 
  FOR SELECT USING (bucket_id = 'kyc_documents');

CREATE POLICY "Auth Upload KYC Docs" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'kyc_documents' AND auth.role() = 'authenticated');
