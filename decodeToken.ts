import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.VITE_SUPABASE_ANON_KEY;
if (!token) {
  console.log('No VITE_SUPABASE_ANON_KEY found');
  process.exit(1);
}

try {
  const payloadBase64 = token.split('.')[1];
  const payloadDecoded = Buffer.from(payloadBase64, 'base64').toString('utf8');
  console.log('Decoded Payload:', payloadDecoded);
  const parsed = JSON.parse(payloadDecoded);
  console.log('Project Ref is:', parsed.ref);
} catch (err: any) {
  console.log('Error decoding:', err.message);
}
process.exit(0);
