import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDetailsVentes() {
  await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  
  const { error } = await supabase.from('details_ventes').insert({
    vente_id: '123e4567-e89b-12d3-a456-426614174000',
    piece_id: '123e4567-e89b-12d3-a456-426614174000',
    quantite: 1,
    prix_vente: 100,
    remise: 0,
    total: 100
  });

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Success (or at least no schema error)');
  }
}

testDetailsVentes().then(() => process.exit());
