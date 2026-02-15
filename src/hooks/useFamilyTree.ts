import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type FamilyMember = Database['public']['Tables']['family_members']['Row'];
type FamilyRelationship = Database['public']['Tables']['family_relationships']['Row'];
type NewFamilyMember = Database['public']['Tables']['family_members']['Insert'];
type NewRelationship = Database['public']['Tables']['family_relationships']['Insert'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const useTree = (treeId: string) => {
  return useQuery({
    queryKey: ['tree', treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('id', treeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!treeId,
  });
};

export const useTreeMembers = (treeId: string) => {
  return useQuery({
    queryKey: ['tree-members', treeId],
    queryFn: async () => {
      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('tree_id', treeId);

      if (membersError) throw membersError;

      // Fetch relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('tree_id', treeId);

      if (relationshipsError) throw relationshipsError;

      return { members, relationships };
    },
    enabled: !!treeId,
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberData,
      relationToId,
      relationType
    }: {
      memberData: NewFamilyMember,
      relationToId?: string,
      relationType?: Database['public']['Enums']['relationship_type']
    }) => {
      // 1. Add the member
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert(memberData)
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. Add relationship if provided
      if (relationToId && relationType) {
        let finalFrom = relationToId;
        let finalTo = newMember.id;
        let finalType = relationType;

        if (relationType === 'parent') {
          // Adding a Parent to existing member (relationToId)
          // So New (Parent) -> Existing (Child)
          finalFrom = newMember.id;
          finalTo = relationToId;
          finalType = 'parent';
        } else if (relationType === 'child') {
          // Adding a Child to existing member (relationToId)
          // So Existing (Parent) -> New (Child)
          finalFrom = relationToId;
          finalTo = newMember.id;
          finalType = 'parent'; // standardized on 'parent' relationship
        } else if (relationType === 'spouse') {
          finalFrom = relationToId;
          finalTo = newMember.id;
          finalType = 'spouse';
        } else if (relationType === 'sibling') {
          finalFrom = relationToId;
          finalTo = newMember.id;
          finalType = 'sibling';

          // Also, if the existing sibling has parents, we should link the new sibling to them?
          // This is complex. For now, just link as sibling.
          // Ideally, we fetch parents of relationToId and add 'parent' links to newMember.
          // unique generation ID helps here?

          // For MVP: Just strict sibling link.
        }

        const { error: relError } = await supabase
          .from('family_relationships')
          .insert({
            tree_id: memberData.tree_id,
            from_member_id: finalFrom, // @ts-ignore
            to_member_id: finalTo,
            relationship: finalType
          });

        if (relError) throw relError;
      }

      return newMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tree-members', variables.memberData.tree_id] });
    },
  });
};

export const useSearchProfiles = (query: string) => {
  return useQuery({
    queryKey: ['search-profiles', query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];

      // Search by phone, email, or vanshmala_id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${query},email.eq.${query},vanshmala_id.eq.${query}`)
        .limit(5);

      // Note: simple OR query. If we want partial match, we need like/ilike.
      // But usually IDs are exact. Phones are exact.

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!query && query.length >= 3,
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, treeId }: { memberId: string, treeId: string }) => {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tree-members', variables.treeId] });
    }
  })
}

export const useMemberByUsername = (username: string) => {
  return useQuery({
    queryKey: ['member-by-username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as FamilyMember;
    },
    enabled: !!username,
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, updates }: { memberId: string, updates: Partial<FamilyMember> }) => {
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['tree-members'] });
      if (variables.updates.username) {
        queryClient.invalidateQueries({ queryKey: ['member-by-username', variables.updates.username] });
      }
    }
  });
};

export const useMemberByUserId = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['member-by-user-id', userId],
    queryFn: async () => {
      // If no userId, don't fetch
      if (!userId) return null;

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as FamilyMember | null;
    },
    enabled: !!userId,
  });
};

export const useIsTreeAdmin = (treeId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['is-tree-admin', treeId, userId],
    queryFn: async () => {
      if (!userId || !treeId) return false;

      const { data, error } = await supabase.rpc('is_tree_admin', {
        _tree_id: treeId,
        _user_id: userId
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data;
    },

    enabled: !!treeId && !!userId,
  });
};

export const useUserTrees = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['user-trees', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('tree_memberships')
        .select(`
          tree_id,
          family_trees:tree_id (
            id,
            family_name
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
