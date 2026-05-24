import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  
  const { data, error } = await supabase
    .from('ventes')
    .select('id, total, details_ventes(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}

check().then(() => process.exit());
