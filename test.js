const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yqvffocoeebkxwypspff.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY');
supabase.from('messages').insert({ user_id: '00000000-0000-0000-0000-000000000000', sender_id: '00000000-0000-0000-0000-000000000000', content: 'test' }).then(res => console.log('Insert Result:', JSON.stringify(res, null, 2)));
