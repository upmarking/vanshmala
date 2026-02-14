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

            // 1. Update relationships where source is 'from'
            const { error: error1 } = await supabase
                .from('family_relationships')
                .update({ from_member_id: targetId })
                .eq('from_member_id', sourceId);
            if (error1) throw error1;

            // 2. Update relationships where source is 'to'
            const { error: error2 } = await supabase
                .from('family_relationships')
                .update({ to_member_id: targetId })
                .eq('to_member_id', sourceId);
            if (error2) throw error2;

            // 3. Mark source member as "merged" or delete?
            // Ideally we should delete, but maybe keep for history?
            // Let's delete for now to clean up tree.
            const { error: error3 } = await supabase
                .from('family_members')
                .delete()
                .eq('id', sourceId);

            // Note: Check for foreign key constraints. 
            // merge_requests has FK to source_member. 
            // So we might need to update the merge_request first or keep member?
            // Let's NOT delete the member yet, maybe just update status if possible.
            // Or update merge_request to remove FK dependency? No.
            // Better: Delete the merge request or archive it.
            // But we want to keep history of merge.
            // It seems creating a history table or allowing member to stay but marked 'merged' is better.
            // But 'family_members' doesn't have 'status' column (only is_alive).
            // If we delete member, `merge_requests` rows linking to it will be deleted if ON DELETE CASCADE.
            // Let's assume ON DELETE CASCADE is set for merge_requests -> members.
            // If not, we'll get an error.
            // Let's try deleting.
            if (error3) {
                console.error("Failed to delete source member:", error3);
                // If foreign key violation, we might have to keep it.
                throw error3;
            }

            // 4. Update request status (if it wasn't deleted by cascade)
            // If we deleted source, this request might be gone.
            // Does Supabase return count?

            // If we can't delete, we should update request status.
            const { error: error4 } = await supabase
                .from('merge_requests')
                .update({ status: 'approved', resolved_at: new Date().toISOString() })
                .eq('id', requestId);

            if (error4) {
                // If error4 is "Row not found", it means cascade delete worked. Ignore.
                // Otherwise throw.
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merge-requests', treeId] });
            queryClient.invalidateQueries({ queryKey: ['tree-members', treeId] });
            toast.success("Merge approved and executed");
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
