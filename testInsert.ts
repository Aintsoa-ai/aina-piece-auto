import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data: signInData } = await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  const userId = signInData.user?.id;
  
  const { data: profile } = await supabase.from('profiles').select('boutique_id').eq('id', userId).single();
  const boutiqueId = profile?.boutique_id;

  console.log('--- TEST INSERT VENTE ---');
  const { data: vData, error: vErr } = await supabase.from('ventes').insert({
    total: 1000,
    utilisateur_id: userId,
    boutique_id: boutiqueId,
    mode_paiement: 'cash',
    remise: 0
  }).select('*').single();
  
  if (vErr) console.error('❌ Vente Error:', vErr.message, vErr.details, vErr.hint);
  else console.log('✅ Vente Inserted:', vData.id);

  console.log('--- TEST INSERT ACHAT ---');
  const { data: aData, error: aErr } = await supabase.from('achats').insert({
    boutique_id: boutiqueId,
    utilisateur_id: userId,
    total: 1000
  }).select('*').single();

  if (aErr) console.error('❌ Achat Error:', aErr.message, aErr.details, aErr.hint);
  else console.log('✅ Achat Inserted:', aData.id);
}

testInsert().then(() => process.exit());
