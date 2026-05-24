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

  console.log('--- TEST INSERT ACHAT WITH FOURNISSEUR ---');
  const { data: aData, error: aErr } = await supabase.from('achats').insert({
    total: 1000,
    fournisseur_id: 'some-uuid'
  }).select('*').single();

  if (aErr) console.error('❌ Achat Error:', aErr.message);
  else console.log('✅ Achat Inserted');
}

testInsert().then(() => process.exit());
