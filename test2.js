const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yqvffocoeebkxwypspff.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY');
async function test() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (users && users.length > 0) {
    const userId = users[0].id;
    console.log('Testing with userId:', userId);
    const { data, error } = await supabase.from('messages').insert({ user_id: userId, sender_id: userId, content: 'test' }).select();
    console.log('Error:', error);
    console.log('Data:', data);
  } else {
    console.log('No users found in public.users');
  }
}
test();
