import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TimelineEvent } from "@/types/schema";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { validateRelationship, getParentIds } from "@/utils/familyRelationUtils";

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
      // ── Step 1: Client-side pre-validation (before wallet deduction) ──
      if (relationToId && relationType) {
        const validation = await validateRelationship({
          relativeId: relationToId,
          relationType,
          treeId: memberData.tree_id,
        });

        if (!validation.ok) {
          throw new Error(validation.error ?? 'Invalid relationship');
        }
      }

      // ── Step 2: Add the member ─────────────────────────────────────────
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert(memberData)
        .select()
        .single();

      if (memberError) throw memberError;

      // ── Step 3: Create the primary relationship row ────────────────────
      if (relationToId && relationType) {
        let finalFrom = relationToId;
        let finalTo = newMember.id;
        let finalType = relationType;

        if (relationType === 'parent') {
          // UI says "add new member as PARENT of relationToId"
          // Store as: new (parent) → existing (child)
          finalFrom = newMember.id;
          finalTo = relationToId;
          finalType = 'parent';
        } else if (relationType === 'child') {
          // UI says "add new member as CHILD of relationToId"
          // Store as: existing (parent) → new (child)
          finalFrom = relationToId;
          finalTo = newMember.id;
          finalType = 'parent'; // DB uses 'parent' direction
        } else if (relationType === 'spouse') {
          // Always store with consistent direction: relativeId → newMember
          finalFrom = relationToId;
          finalTo = newMember.id;
          finalType = 'spouse';
        } else if (relationType === 'sibling') {
          // Canonical direction: LEAST UUID → GREATEST UUID
          finalFrom = relationToId < newMember.id ? relationToId : newMember.id;
          finalTo = relationToId < newMember.id ? newMember.id : relationToId;
          finalType = 'sibling';
        }

        const { error: relError } = await supabase
          .from('family_relationships')
          .insert({
            tree_id: memberData.tree_id,
            from_member_id: finalFrom, // @ts-ignore
            to_member_id: finalTo,
            relationship: finalType
          });

        if (relError) {
          // Map DB-level error codes to user-friendly messages
          const msg = relError.message ?? '';
          if (msg.includes('SELF_RELATION')) throw new Error('A member cannot be related to themselves.');
          if (msg.includes('MAX_PARENTS')) throw new Error('This child already has 2 parents. Cannot add more.');
          if (msg.includes('MAX_SPOUSE')) throw new Error('This member already has a spouse.');
          throw relError;
        }

        // ── Step 4: Sibling — inherit parents from reference sibling ──────
        // When adding a NEW member as a SIBLING of an existing member,
        // the new member should also share the same parents. The DB trigger
        // `after_parent_insert_link_siblings` then auto-creates sibling rows.
        if (relationType === 'sibling') {
          const parentIds = await getParentIds(relationToId, memberData.tree_id);
          for (const parentId of parentIds) {
            const { error: parentLinkError } = await supabase
              .from('family_relationships')
              .insert({
                tree_id: memberData.tree_id,
                from_member_id: parentId, // @ts-ignore
                to_member_id: newMember.id,
                relationship: 'parent'
              })
              .select()
              .maybeSingle();
            // Ignore conflict — sibling may already be processed by trigger
            if (parentLinkError && !parentLinkError.message.includes('unique')) {
              console.warn('Parent link warning (sibling inherit):', parentLinkError.message);
            }
          }
        }
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

      const trimmedQuery = query.trim();

      // Search by phone (exact), email (exact), vanshmala_id (case-insensitive), or full_name (partial)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(
          `phone.eq.${trimmedQuery},email.ilike.${trimmedQuery},vanshmala_id.ilike.${trimmedQuery},full_name.ilike.%${trimmedQuery}%`
        )
        .limit(10);

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

      // Also fetch profile-level fields (is_verified, vanshmala_id) if user_id exists
      let profileExtra: { is_verified?: boolean; vanshmala_id?: string; referral_code?: string } = {};
      if (data?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_verified, vanshmala_id, referral_code')
          .eq('user_id', data.user_id)
          .single();
        if (profileData) {
          profileExtra = profileData as any;
        }
      }

      return { ...data, ...profileExtra } as FamilyMember & { is_verified?: boolean; vanshmala_id?: string };
    },
    enabled: !!username,
  });
};

export const useUserFeedPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-feed-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      // Find profile id from user_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (!profileData) return [];

      const { data, error } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Parse JSONB fields
      return (data || []).map((post: any) => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : [],
      }));
    },
    enabled: !!userId,
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

export const useDelinkMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-members'] });
    }
  });
};

export const useAddRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      treeId,
      fromMemberId,
      toMemberId,
      relationship,
    }: {
      treeId: string;
      fromMemberId: string;
      toMemberId: string;
      relationship: Database['public']['Enums']['relationship_type'];
    }) => {
      const { data, error } = await supabase
        .from('family_relationships')
        .insert({ tree_id: treeId, from_member_id: fromMemberId, to_member_id: toMemberId, relationship })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tree-members', vars.treeId] });
    },
  });
};

export const useRemoveRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ relationshipId, treeId }: { relationshipId: string; treeId: string }) => {
      const { error } = await supabase
        .from('family_relationships')
        .delete()
        .eq('id', relationshipId);
      if (error) throw error;
      return { relationshipId, treeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tree-members', result.treeId] });
    },
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

export const useProfileVerificationStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-verification', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc('get_profile_verification_status' as any, {
        check_user_id: userId
      });
      if (error) {
        console.error('Error fetching verification status:', error);
        return false;
      }
      return data;
    },
    enabled: !!userId,
  });
};

export const useTimelineEvents = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['timeline-events', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('family_member_id', memberId)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(event => ({
        ...event,
        media_urls: typeof event.media_urls === 'string' ? JSON.parse(event.media_urls) : (event.media_urls ?? [])
      })) as TimelineEvent[];
    },
    enabled: !!memberId,
  });
};

export const useAddTimelineEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      family_member_id: string;
      title: string;
      date: string | null;
      event_type: string;
      description?: string;
      created_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('timeline_events')
        .insert({ ...event, media_urls: [] })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline-events', variables.family_member_id] });
    }
  });
};

export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data as unknown as Array<{
        id: string;
        user_id: string;
        title: string;
        body: string | null;
        link: string | null;
        is_read: boolean;
        created_at: string;
      }>) || [];
    },
    enabled: !!userId,
    refetchInterval: 30_000, // poll every 30 s
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', vars.userId] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', vars.userId] });
    },
  });
};
