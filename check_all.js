import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('=== PIECES ===');
  const { data: pieces, error: pe } = await supabase.from('pieces').select('id, reference, designation').ilike('reference', 'TEST%');
  if (pe) console.error('pieces error:', pe);
  else console.log(pieces);

  console.log('\n=== STOCK ===');
  const { data: stock, error: se } = await supabase.from('stock').select('*');
  if (se) console.error('stock error:', se);
  else console.log(stock);

  console.log('\n=== BOUTIQUES ===');
  const { data: boutiques, error: be } = await supabase.from('boutiques').select('*');
  if (be) console.error('boutiques error:', be);
  else console.log(boutiques);
}
run();
