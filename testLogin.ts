import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or ANON key missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = 'ainapieces2026@gmail.com';
  const password = 'AinaDbAutoParts2026!';
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('❌ Login failed:', signInError.message);
    return;
  }
  console.log('✅ Login successful, user ID:', signInData.user?.id);

  // Fetch profile/role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', signInData.user?.id)
    .single();

  if (profileError) {
    console.error('❌ Could not fetch profile:', profileError.message);
    return;
  }
  console.log('👤 Profile fetched successfully:', {
    full_name: profile.full_name,
    role: profile.roles?.name,
    boutique_id: profile.boutique_id
  });
}

testLogin().then(() => process.exit());
