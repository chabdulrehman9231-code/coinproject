'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function checkPhoneExists(phone: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phone)
      .limit(1);
      
    if (error) {
      console.error("Error checking phone:", error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error("Exception checking phone:", error);
    return false;
  }
}
