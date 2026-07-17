const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient('https://yqvffocoeebkxwypspff.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY');
async function test() {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('user_id, content, created_at, users!messages_user_id_fkey(email)')
      .order('created_at', { ascending: false });
    console.log('Error:', error);
    console.log('Data:', data);
}
test();
