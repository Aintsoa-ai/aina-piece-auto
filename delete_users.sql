-- Exécutez ce code dans le SQL Editor de Supabase pour créer la fonction de suppression
CREATE OR REPLACE FUNCTION delete_non_admin_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Récupère l'UUID du rôle 'administrateur' de manière sécurisée
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'administrateur' LIMIT 1;

  -- Supprime de la table auth.users tous les utilisateurs dont le rôle n'est pas l'UUID administrateur
  DELETE FROM auth.users 
  WHERE id IN (
    SELECT id 
    FROM public.profiles 
    WHERE role_id != admin_role_id OR role_id IS NULL
  );
END;
$$;
