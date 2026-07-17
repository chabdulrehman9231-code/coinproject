const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yqvffocoeebkxwypspff.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTQ5MjUsImV4cCI6MjA5OTUzMDkyNX0.lzQsRsB6WyC_8SBlF-est6B_Dl8pi9kFo5kUBVHkxZo');
async function test() {
    const userId = '69b9232e-ce30-46aa-ac51-97f8870039ed';
    const { data, error } = await supabase.from('messages').insert({ user_id: userId, sender_id: userId, content: 'test-anon' }).select();
    console.log('Error:', error);
    console.log('Data:', data);
}
test();
