-- Exécutez ce code dans le SQL Editor de Supabase pour créer la fonction de suppression
CREATE OR REPLACE FUNCTION delete_non_admin_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprime de la table auth.users tous les utilisateurs dont l'ID ne correspond pas
  -- à un profil avec le rôle 'administrateur'
  DELETE FROM auth.users 
  WHERE id NOT IN (
    SELECT id FROM public.profiles WHERE role_id = 'administrateur' OR role_id = 'Administrateur'
  );
END;
$$;
