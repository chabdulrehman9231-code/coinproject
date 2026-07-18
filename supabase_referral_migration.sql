-- 1. Add referral_code column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- 2. Create function to generate random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing users with unique referral codes
UPDATE public.users
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- 4. Make referral_code column NOT NULL
ALTER TABLE public.users ALTER COLUMN referral_code SET NOT NULL;

-- 5. Update the signup trigger function to generate referral code automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate unique referral code
  LOOP
    new_code := public.generate_referral_code();
    PERFORM 1 FROM public.users WHERE referral_code = new_code;
    IF NOT FOUND THEN
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.users (id, email, full_name, phone_number, role, credit_score, vip_level, referral_code)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    'user',
    700,
    'Bronze',
    new_code
  );
  
  -- Create a default USDT wallet with 0 balance
  INSERT INTO public.wallets (user_id, asset, balance)
  VALUES (new.id, 'USDT', 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;
