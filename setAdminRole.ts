import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or SERVICE ROLE KEY missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'ainapieces2026@gmail.com';

async function setAdmin() {
  // 1️⃣ Sign‑in to obtain the user id
  const temp = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY as string);
  const { data: signIn, error: signInErr } = await temp.auth.signInWithPassword({ email, password: 'Aina201287*' });
  if (signInErr) {
    console.error('❌ Sign‑in failed:', signInErr.message);
    return;
  }
  const userId = signIn.user?.id;
  if (!userId) {
    console.error('❌ No user id returned');
    return;
  }
  console.log('✅ Signed in, user id:', userId);

  // 2️⃣ Fetch role ID for 'administrateur'
  const { data: roleData, error: roleErr } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'administrateur')
    .single();

  if (roleErr || !roleData) {
    console.error('❌ Failed to fetch administrateur role ID:', roleErr?.message);
    return;
  }
  console.log('✅ Found role id:', roleData.id);

  // 3️⃣ Upsert profile in profiles table
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      full_name: 'Administrateur Aina', 
      role_id: roleData.id 
    }, { onConflict: 'id' });
    
  if (upsertErr) {
    console.error('❌ Upsert profiles failed:', upsertErr.message);
  } else {
    console.log('✅ Role set to administrateur in profiles for', email);
  }
}

setAdmin().then(() => process.exit());
