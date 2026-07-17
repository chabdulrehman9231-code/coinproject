-- 1. Ensure table exists (just in case)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- 2. Grant necessary privileges to the authenticated and anon roles
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;
GRANT ALL ON messages TO service_role;

-- 3. Enable RLS (we will use strict policies instead of disabling it to prevent errors)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop any old policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Admins have full access" ON messages;

-- 5. Create policy for Users (Read)
CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT 
USING (auth.uid() = user_id);

-- 6. Create policy for Users (Insert)
CREATE POLICY "Users can insert their own messages" 
ON messages FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() = sender_id);

-- 7. Create policy for Admins (Full Access)
CREATE POLICY "Admins have full access" 
ON messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'superadmin'
  )
);
