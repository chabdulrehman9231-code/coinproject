const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase
  .from('option_trades')
  .select('*')
  .eq('status', 'pending')
  .then(async res => {
    console.log('Trades:', res.data);
    if(res.data && res.data.length > 0) {
      const userId = res.data[0].user_id;
      console.log('Fetching user for id:', userId);
      const userRes = await supabase.from('users').select('*').eq('id', userId).single();
      console.log('User data:', userRes.data);
      console.log('User error:', userRes.error);
    }
  });
