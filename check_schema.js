const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yqvffocoeebkxwypspff.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY'
);

async function checkSchema() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log(data, error);
}

checkSchema();
