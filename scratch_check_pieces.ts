import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs service role to bypass RLS if any

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPieces() {
  const { data: pieces, error: piecesErr } = await supabase.from('pieces').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Pieces:", pieces);
  
  if (pieces && pieces.length > 0) {
    const { data: stock, error: stockErr } = await supabase.from('stock').select('*').eq('piece_id', pieces[0].id);
    console.log("Stock for latest piece:", stock);
  }
}

checkPieces();
