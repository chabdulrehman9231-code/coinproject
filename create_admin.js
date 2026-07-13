const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yqvffocoeebkxwypspff.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  const email = 'admin@coinbase.com';
  const password = 'Admin123!';

  console.log(`Creating user: ${email}`);
  
  // Create user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  let userId;

  if (authError) {
    if (authError.message.includes('already exists') || authError.code === 'user_already_exists') {
        console.log('User already exists in auth.');
        
        // Let's get the user ID using normal query (workaround if admin API doesn't return list easily)
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
           userId = existingUser.id;
        } else {
           console.log('User not found in public.users');
           return;
        }
    } else {
        console.error('Error creating user in auth:', authError);
        return;
    }
  } else {
    console.log('User created in auth successfully.');
    userId = authData.user.id;
    // Wait a brief moment for the database trigger to insert the user into public.users
    await new Promise(r => setTimeout(r, 2000));
  }

  if (userId) {
      console.log(`Updating role to superadmin for user ID: ${userId}`);
      // Update role in public.users
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ role: 'superadmin' })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('Error updating role in public.users:', updateError);
      } else {
        console.log('Successfully set user role to superadmin:', updateData);
      }
  }
}

createSuperAdmin();
