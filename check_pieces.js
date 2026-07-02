import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: dbPieces, error } = await supabase.from('pieces').select('*').order('reference', { ascending: false }).limit(5);
  console.log('Last 5 pieces by reference:', dbPieces?.map(p => ({ id: p.id, ref: p.reference })));
  
  // Find test piece
  const { data: testPieces } = await supabase.from('pieces').select('*').ilike('reference', '%test%');
  console.log('Test pieces:', testPieces?.map(p => ({ id: p.id, ref: p.reference })));
  
  if (testPieces && testPieces.length > 0) {
    for (const p of testPieces) {
      const { data: stock } = await supabase.from('stock').select('*').eq('piece_id', p.id);
      console.log(`Stock for ${p.reference}:`, stock);
    }
  }
}
run();
