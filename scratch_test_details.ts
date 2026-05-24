import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDetails() {
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  if (authErr) return console.error('Auth err', authErr);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  console.log('Profile:', profile);

  const { data: v, error: vErr } = await supabase.from('ventes').insert({
    total: 1000, boutique_id: profile.boutique_id, caissier_id: profile.id
  }).select('*').single();

  if (vErr) return console.error('Vente err:', vErr);
  console.log('Vente inserted:', v.id);

  const { data: p } = await supabase.from('pieces').select('id').limit(1).single();

  const { error: dErr } = await supabase.from('details_ventes').insert({
    vente_id: v.id,
    piece_id: p!.id,
    quantite: 1,
    prix_vente: 1000,
    remise: 0,
    total: 1000
  });

  if (dErr) console.error('Details err:', dErr);
  else console.log('Details inserted successfully');
}

testDetails().then(() => process.exit());
