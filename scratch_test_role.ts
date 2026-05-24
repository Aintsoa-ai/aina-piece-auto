import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  console.log('Role query:', data, error);
}

check().then(() => process.exit());
