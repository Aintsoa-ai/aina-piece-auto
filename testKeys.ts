import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

async function inspect() {
  const { data: aData } = await supabase.from('achats').select('*').limit(1);
  console.log('achats keys:', aData?.[0] ? Object.keys(aData[0]) : 'no data');
  
  const { data: vData } = await supabase.from('ventes').select('*').limit(1);
  console.log('ventes keys:', vData?.[0] ? Object.keys(vData[0]) : 'no data');
}

inspect().then(() => process.exit());
