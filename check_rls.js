import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: policies, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'stock');
  console.log('Policies error:', error);
  console.log('Policies for stock:', policies);
}
run();
