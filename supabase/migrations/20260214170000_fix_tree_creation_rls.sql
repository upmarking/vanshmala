-- Fix 403 error on tree creation by allowing creators to view their trees
-- This resolves the issue where the membership trigger hasn't seemingly propagated 
-- to the is_tree_member check during the return of the INSERT transaction.

CREATE POLICY "Creators can view their trees" ON public.family_trees
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
