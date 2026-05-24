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

  // Insert Vente
  const { data: newVente, error: venteErr } = await supabase
    .from('ventes')
    .insert({
      total: 12600,
      utilisateur_id: userId || null,
      boutique_id: boutiqueId || null
    })
    .select('*')
    .single();

  if (venteErr) {
    console.error('❌ Vente Error:', venteErr.message);
    return;
  }
  console.log('✅ Vente Inserted:', newVente.id);

  // Fetch a piece to use
  const { data: piece } = await supabase.from('pieces').select('id, prix_vente').limit(1).single();
  
  if (!piece) {
    console.log('No pieces found');
    return;
  }

  // Insert Details Vente
  const { error: detailsErr } = await supabase
    .from('details_ventes')
    .insert({
      vente_id: newVente.id,
      piece_id: piece.id,
      quantite: 1,
      prix_vente: piece.prix_vente,
      remise: 0,
      total: piece.prix_vente
    });

  if (detailsErr) {
    console.error('❌ Details Vente Error:', detailsErr.message);
  } else {
    console.log('✅ Details Vente Inserted');
  }
}

testInsert().then(() => process.exit());
