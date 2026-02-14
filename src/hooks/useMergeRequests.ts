import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MergeRequest = Database['public']['Tables']['merge_requests']['Row'];
type NewMergeRequest = Database['public']['Tables']['merge_requests']['Insert'];

export const useMergeRequests = (treeId: string) => {
    const queryClient = useQueryClient();

    // Fetch pending requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['merge-requests', treeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('merge_requests')
                .select(`
            *,
            source_member:source_member_id ( full_name, vanshmala_id ),
            target_member:target_member_id ( full_name, vanshmala_id )
        `)
                .eq('tree_id', treeId)
                .eq('status', 'pending');

            if (error) throw error;
            return data;
        },
        enabled: !!treeId,
    });

    const createRequest = useMutation({
        mutationFn: async (request: NewMergeRequest) => {
            const { error } = await supabase
                .from('merge_requests')
                .insert(request);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merge-requests', treeId] });
            toast.success("Merge request created");
        },
        onError: (err) => {
            toast.error("Failed to create merge request: " + err.message);
        }
    });

    const approveRequest = useMutation({
        mutationFn: async (requestId: string) => {
            // Fetch request details first
            const { data: request, error: fetchError } = await supabase
                .from('merge_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (fetchError) throw fetchError;
            if (!request) throw new Error("Request not found");

            const sourceId = request.source_member_id;
            const targetId = request.target_member_id;

            // Perform Merge Logic (Frontend Transaction Simulation)
            // We must update ALL references to sourceId to targetId

            // 1. Update relationships where source is 'from'
            const { error: error1 } = await supabase
                .from('family_relationships')
                .update({ from_member_id: targetId })
                .eq('from_member_id', sourceId);
            if (error1) throw new Error("Failed to update from_relationships: " + error1.message);

            // 2. Update relationships where source is 'to'
            const { error: error2 } = await supabase
                .from('family_relationships')
                .update({ to_member_id: targetId })
                .eq('to_member_id', sourceId);
            if (error2) throw new Error("Failed to update to_relationships: " + error2.message);

            // 3. Update Timeline Events
            const { error: errorTimeline } = await supabase
                .from('timeline_events')
                .update({ family_member_id: targetId })
                .eq('family_member_id', sourceId);
            if (errorTimeline) throw new Error("Failed to update timeline events: " + errorTimeline.message);

            // 4. Update Legacy Messages (Target Member)
            const { error: errorLegacy } = await supabase
                .from('legacy_messages')
                .update({ target_family_member_id: targetId })
                .eq('target_family_member_id', sourceId);
            if (errorLegacy) throw new Error("Failed to update legacy messages: " + errorLegacy.message);

            // 5. Update Tree Memberships (User Accounts linked to this member)
            const { error: errorMembership } = await supabase
                .from('tree_memberships')
                .update({ member_id: targetId })
                .eq('member_id', sourceId);
            if (errorMembership) throw new Error("Failed to update tree memberships: " + errorMembership.message);


            // 6. Delete source member
            // Now safe to delete as references are moved.
            const { error: errorDelete } = await supabase
                .from('family_members')
                .delete()
                .eq('id', sourceId);

            if (errorDelete) {
                console.error("Failed to delete source member:", errorDelete);
                // If foreign key violation still exists, we might have missed a table.
                // But we should try to proceed to update request status.
                throw new Error("Failed to delete source member. Partial merge may have occurred. Error: " + errorDelete.message);
            }

            // 7. Update request status
            const { error: errorStatus } = await supabase
                .from('merge_requests')
                .update({ status: 'approved', resolved_at: new Date().toISOString() })
                .eq('id', requestId);

            if (errorStatus) throw errorStatus;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merge-requests', treeId] });
            queryClient.invalidateQueries({ queryKey: ['tree-members', treeId] });
            toast.success("Merge approved and executed successfully");
        },
        onError: (err) => {
            toast.error("Merge failed: " + err.message);
        }
    });

    const rejectRequest = useMutation({
        mutationFn: async (requestId: string) => {
            const { error } = await supabase
                .from('merge_requests')
                .update({ status: 'rejected', resolved_at: new Date().toISOString() })
                .eq('id', requestId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merge-requests', treeId] });
            toast.success("Merge request rejected");
        },
        onError: (err) => {
            toast.error("Rejection failed: " + err.message);
        }
    });

    return { requests, isLoading, createRequest, approveRequest, rejectRequest };
};
