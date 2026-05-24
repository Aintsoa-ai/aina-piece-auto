import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKeys() {
  await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });

  const { data: bData } = await supabase.from('boutiques').select('id').limit(1);
  if (!bData || bData.length === 0) {
    console.log('No boutiques found');
    return;
  }
  const boutiqueId = bData[0].id;

  const { data: cData, error } = await supabase.from('caisse').insert({
    boutique_id: boutiqueId,
    montant_debut: 100,
    statut: 'OUVERT'
  }).select('*').single();

  if (error) {
    console.log('Insert error:', error.message);
  } else {
    console.log('✅ Keys in caisse:', Object.keys(cData).join(', '));
    // Clean up
    await supabase.from('caisse').delete().eq('id', cData.id);
  }
}

testKeys().then(() => process.exit());
