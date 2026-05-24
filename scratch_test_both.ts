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
  
  // fetch recent vente
  const { data: v } = await supabase.from('ventes').select('id').limit(1).single();
  
  // try to fetch details
  const { data: d } = await supabase.from('details_ventes').select('*').eq('vente_id', v!.id);
  console.log('Details fetched:', d);

  // try to insert
  const { data: p } = await supabase.from('pieces').select('id').limit(1).single();
  const { error: insErr } = await supabase.from('details_ventes').insert({
    vente_id: v!.id,
    piece_id: p!.id,
    quantite: 1,
    prix_vente: 100,
    remise: 0,
    total: 100
  });
  console.log('Insert err:', insErr);
}

check().then(() => process.exit());
