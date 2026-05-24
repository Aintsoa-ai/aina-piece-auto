import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', 
    password: 'AinaDbAutoParts2026!' 
  });
  
  if (signInError) {
    console.error('❌ Login failed:', signInError.message);
    return;
  }

  const { data: pfData, error: pfError } = await supabase
    .from('piece_fournisseurs')
    .select('piece_id, prix_achat');
  if (pfError) console.error('❌ pfError:', pfError.message);
  else console.log('✅ pfData fetched');

  const { data: stockData, error: stockError } = await supabase
    .from('stock')
    .select('*, pieces(*)');
  if (stockError) console.error('❌ stockError:', stockError.message);
  else console.log('✅ stockData fetched');

  const { data: sales, error: salesError } = await supabase
    .from('ventes')
    .select('*, details_ventes(*, pieces(designation, reference)), profiles(full_name)')
    .order('created_at', { ascending: false });
  if (salesError) console.error('❌ salesError:', salesError.message);
  else console.log(`✅ Sales fetched: ${sales?.length}`);
}

testFetch().then(() => process.exit());
