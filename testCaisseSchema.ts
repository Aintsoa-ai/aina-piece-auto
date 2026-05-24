import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchema() {
  await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });

  const { data, error } = await supabase.from('caisse').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(`✅ caisse keys:`, Object.keys(data[0]).join(', '));
  } else {
    console.log('No data found, error:', error?.message);
    
    // Let's insert a dummy row with valid data based on the columns we think exist
    const { error: e2 } = await supabase.from('caisse').insert({
      boutique_id: '123e4567-e89b-12d3-a456-426614174000',
      montant_debut: 500000,
      statut: 'OUVERT'
    }).select('*');
    console.log('Insert error without any user ID:', e2?.message);
    
    // Let's test inserting with user_id
    const { error: e3 } = await supabase.from('caisse').insert({
      boutique_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      montant_debut: 500000,
      statut: 'OUVERT'
    });
    console.log('Insert error with user_id:', e3?.message);
  }
}

testSchema().then(() => process.exit());
