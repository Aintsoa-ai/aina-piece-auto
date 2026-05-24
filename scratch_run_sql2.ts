import { Client } from 'pg';
import fs from 'fs';

async function run() {
  const connectionString = 'postgres://postgres.aatsnrhdbfoidwcvmbdk:Aina201287*@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000 
  });
  
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected!');
    
    // Drop ALL existing policies on the 4 tables manually to be absolutely sure
    console.log('Dropping old policies...');
    const tables = ['ventes', 'caisse', 'depenses', 'details_ventes'];
    for (const table of tables) {
      const { rows } = await client.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = $1 AND schemaname = 'public';
      `, [table]);
      
      for (const row of rows) {
        console.log(`Dropping policy "${row.policyname}" on ${table}...`);
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public.${table};`);
      }
    }

    console.log('Executing sql script...');
    const sql = fs.readFileSync('d:/PROJET_COMMANDE_CLIENT/AINA PIECE AUTO/supabase_rls_lock.sql', 'utf8');
    await client.query(sql);
    
    console.log('SQL Executed successfully!');
  } catch (err) {
    console.error('Connection or Execution error:', err);
  } finally {
    await client.end();
  }
}

run();
