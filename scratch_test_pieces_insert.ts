import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const email = 'ainapieces2026@gmail.com';
  const password = 'AinaDbAutoParts2026!';
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('❌ Login failed:', signInError.message);
    return;
  }
  
  const { data: newPiece, error: insertError } = await supabase.from('pieces').insert({ reference: 'TEST-PIECE-1', designation: 'TEST PIECE' }).select('id').single();
  if (insertError) {
    console.error('❌ Insert failed:', insertError);
  } else {
    console.log('✅ Insert successful', newPiece);
  }
}

testInsert().then(() => process.exit());
