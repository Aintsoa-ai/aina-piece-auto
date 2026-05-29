-- Exécutez ce code dans le SQL Editor de Supabase pour créer la fonction de suppression
CREATE OR REPLACE FUNCTION delete_non_admin_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprime de la table auth.users tous les utilisateurs dont le rôle n'est pas 'administrateur'
  -- On joint la table roles car role_id est un UUID
  DELETE FROM auth.users 
  WHERE id IN (
    SELECT p.id 
    FROM public.profiles p
    LEFT JOIN public.roles r ON p.role_id = r.id
    WHERE r.name != 'administrateur' OR r.name IS NULL
  );
END;
$$;
