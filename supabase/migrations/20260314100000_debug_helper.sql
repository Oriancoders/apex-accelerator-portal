
-- Debug function to fetch memberships bypassing RLS
CREATE OR REPLACE FUNCTION public.debug_my_memberships()
RETURNS TABLE (
  company_id UUID,
  role TEXT,
  is_primary BOOLEAN,
  user_check UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.company_id, cm.role, cm.is_primary, cm.user_id
  FROM public.company_memberships cm
  WHERE cm.user_id = auth.uid();
END;
$$;
