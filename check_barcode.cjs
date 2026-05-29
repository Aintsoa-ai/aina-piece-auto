require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: piece, error } = await supabase.from('pieces').select('*').eq('code_barre', '3266720059040');
  console.log("Piece:", piece);
  
  if (piece && piece.length > 0) {
    const { data: stock, error: stErr } = await supabase.from('stock').select('*, pieces(*)').eq('piece_id', piece[0].id);
    console.log("Stock:", stock);
    console.log("StErr:", stErr);
  }
}
check();
