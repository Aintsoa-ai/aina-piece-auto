import { Client } from 'pg';
import fs from 'fs';

async function run() {
  const connectionString = 'postgres://postgres.aatsnrhdbfoidwcvmbdk:Aina201287*@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected!');
    
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
