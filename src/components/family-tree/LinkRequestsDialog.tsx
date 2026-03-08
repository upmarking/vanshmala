import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Sparkles, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface LinkRequestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
}

interface LinkRequest {
  id: string;
  full_name: string;
  relationship_claim: string | null;
  status: string;
  ai_suggested_relationship: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  ai_suggested_parent_id: string | null;
  created_at: string;
  requester_user_id: string;
}

export const LinkRequestsDialog = ({ isOpen, onClose, treeId }: LinkRequestsDialogProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen, treeId]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tree_link_requests')
      .select('*')
      .eq('tree_id', treeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setRequests((data as LinkRequest[]) || []);
    setLoading(false);
  };

  const analyzeWithAI = async (requestId: string) => {
    setAnalyzingId(requestId);
    const { data, error } = await supabase.functions.invoke('ai-tree-optimize', {
      body: { action: 'analyze_link_request', tree_id: treeId, link_request_id: requestId },
    });

    if (error || !data?.success) {
      toast.error(t('AI analysis failed', 'AI विश्लेषण विफल'));
    } else {
      toast.success(t('AI analysis complete', 'AI विश्लेषण पूर्ण'));
      await fetchRequests();
    }
    setAnalyzingId(null);
  };

  const handleApprove = async (req: LinkRequest) => {
    setProcessingId(req.id);

    // Add as family member
    const { data: newMember, error: memberError } = await supabase
      .from('family_members')
      .insert({
        tree_id: treeId,
        full_name: req.full_name,
        user_id: req.requester_user_id,
      })
      .select()
      .single();

    if (memberError) {
      toast.error(t('Failed to add member', 'सदस्य जोड़ने में विफल'));
      setProcessingId(null);
      return;
    }

    // If AI suggested a relationship, create it
    if (req.ai_suggested_parent_id && req.ai_suggested_relationship && newMember) {
      const relType = req.ai_suggested_relationship as any;
      if (['parent', 'child', 'spouse', 'sibling'].includes(relType)) {
        await supabase.from('family_relationships').insert({
          tree_id: treeId,
          from_member_id: req.ai_suggested_parent_id,
          to_member_id: newMember.id,
          relationship: relType === 'child' ? 'parent' : relType,
        });
      }
    }

    // Update request status
    await supabase
      .from('tree_link_requests')
      .update({ status: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', req.id);

    toast.success(t('Member added to tree!', 'सदस्य वंशवृक्ष में जोड़ा गया!'));
    queryClient.invalidateQueries({ queryKey: ['tree-members', treeId] });
    await fetchRequests();
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    await supabase
      .from('tree_link_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', requestId);
    toast.success(t('Request rejected', 'अनुरोध अस्वीकृत'));
    await fetchRequests();
    setProcessingId(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {t('Link Requests', 'लिंक अनुरोध')}
          </DialogTitle>
          <DialogDescription>
            {t('People requesting to join your family tree.', 'आपके वंशवृक्ष से जुड़ने का अनुरोध करने वाले लोग।')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              {t('Loading...', 'लोड हो रहा है...')}
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{req.full_name}</p>
                      {req.relationship_claim && (
                        <p className="text-xs text-muted-foreground mt-1">
                          "{req.relationship_claim}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {t('Pending', 'लंबित')}
                    </Badge>
                  </div>

                  {/* AI Analysis */}
                  {req.ai_reasoning ? (
                    <div className="p-3 rounded-md bg-muted/50 border border-border">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">{t('AI Suggestion', 'AI सुझाव')}</span>
                        {req.ai_confidence && (
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {req.ai_confidence}% {t('confidence', 'विश्वास')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{req.ai_reasoning}</p>
                      {req.ai_suggested_relationship && (
                        <p className="text-xs text-foreground font-medium mt-1">
                          → {t('Suggested', 'सुझाव')}: {req.ai_suggested_relationship}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => analyzeWithAI(req.id)}
                      disabled={analyzingId === req.id}
                    >
                      {analyzingId === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {analyzingId === req.id
                        ? t('AI is analyzing...', 'AI विश्लेषण कर रहा है...')
                        : t('Analyze with AI', 'AI से विश्लेषण करें')}
                    </Button>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(req.id)}
                      disabled={processingId === req.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t('Reject', 'अस्वीकार')}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      {t('Approve & Add', 'स्वीकार करें')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
              <p>{t('No pending link requests.', 'कोई लंबित लिंक अनुरोध नहीं।')}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
