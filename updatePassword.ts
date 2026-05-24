import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL ou SERVICE ROLE KEY manquant dans .env.local');
  process.exit(1);
}

// Client avec la clé service (permet de mettre à jour n'importe quel compte)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const email = 'ainapieces2026@gmail.com';
const newPassword = 'AinaDbAutoParts2026!';

async function updatePassword() {
  // 1. Chercher l'utilisateur par email
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Impossible de lister les utilisateurs:', listError.message);
    return;
  }

  const user = listData.users.find(u => u.email === email);
  if (!user) {
    console.error(`❌ Utilisateur "${email}" non trouvé dans Supabase Auth.`);
    return;
  }
  console.log('✅ Utilisateur trouvé, ID:', user.id);

  // 2. Mettre à jour le mot de passe
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error('❌ Échec mise à jour du mot de passe:', updateError.message);
    return;
  }
  console.log(`✅ Mot de passe mis à jour avec succès pour ${email}`);
  console.log(`🔑 Nouveau mot de passe: ${newPassword}`);

  // 3. Vérification : tenter une connexion avec le nouveau mot de passe
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
  const tempClient = createClient(supabaseUrl, anonKey);
  const { data: loginData, error: loginError } = await tempClient.auth.signInWithPassword({
    email,
    password: newPassword,
  });

  if (loginError) {
    console.error('❌ Vérification échouée:', loginError.message);
  } else {
    console.log('✅ Vérification réussie! Connexion avec le nouveau mot de passe OK.');
    console.log('👤 User ID:', loginData.user?.id);
  }
}

updatePassword().then(() => process.exit());
