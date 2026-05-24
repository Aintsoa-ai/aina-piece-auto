import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchema() {
  const { data: signInData } = await supabase.auth.signInWithPassword({ 
    email: 'ainapieces2026@gmail.com', password: 'AinaDbAutoParts2026!' 
  });
  
  // Since we don't have direct SQL access through supabase-js standard client, we can query a single row of all tables 
  // or use the rest API.
  // We can fetch one row and log its keys. Wait, if the row is empty, we get nothing.
  
  // But we CAN use the schema API or just insert with completely empty object to see what fails.
  const tables = ['ventes', 'details_ventes', 'achats', 'details_achats', 'mouvements_stock', 'stock'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`✅ ${table} keys:`, Object.keys(data[0]).join(', '));
    } else {
      console.log(`⚠️ ${table} is empty or blocked`);
      // Try an insert with invalid column to see the error, or try inserting empty
      const { error: err2 } = await supabase.from(table).insert({ _nonexistent: 1 });
      if (err2) {
        console.log(`   Error for ${table}:`, err2.message);
      }
    }
  }
}

testSchema().then(() => process.exit());
