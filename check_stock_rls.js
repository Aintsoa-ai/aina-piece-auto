import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: pieces, error } = await supabase.from('pieces').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  console.log('Last 5 pieces:', pieces?.map(p => ({ id: p.id, ref: p.reference })));

  if (pieces && pieces.length > 0) {
    const { data: stock } = await supabase.from('stock').select('*').eq('piece_id', pieces[0].id);
    console.log(`Stock for ${pieces[0].reference}:`, stock);
  }
}
run();
