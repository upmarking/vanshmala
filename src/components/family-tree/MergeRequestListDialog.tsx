import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMergeRequests } from '@/hooks/useMergeRequests';
import { useIsTreeAdmin } from '@/hooks/useFamilyTree';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MergeRequestListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    treeId: string;
}

export const MergeRequestListDialog = ({ isOpen, onClose, treeId }: MergeRequestListDialogProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { requests, isLoading, approveRequest, rejectRequest } = useMergeRequests(treeId);
    const { data: isAdmin } = useIsTreeAdmin(treeId, user?.id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t('Merge Requests', 'विलय अनुरोध')}</DialogTitle>
                    <DialogDescription>
                        {t('Review and approve requests to merge duplicate profiles.', 'डुप्लिकेट प्रोफाइल को विलय करने के अनुरोधों की समीक्षा और अनुमोदन करें।')}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t('Loading...', 'लोड हो रहा है...')}</div>
                    ) : requests && requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-destructive">{req.source_member?.full_name}</span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold text-green-600">{req.target_member?.full_name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {t('Source ID', 'स्रोत ID')}: {req.source_member?.vanshmala_id}
                                            <br />
                                            {t('Target ID', 'लक्ष्य ID')}: {req.target_member?.vanshmala_id}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        {isAdmin && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => rejectRequest.mutate(req.id)}
                                                    disabled={rejectRequest.isPending || approveRequest.isPending}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-50"
                                                    onClick={() => approveRequest.mutate(req.id)}
                                                    disabled={rejectRequest.isPending || approveRequest.isPending}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>{t('No pending merge requests.', 'कोई लंबित विलय अनुरोध नहीं हैं।')}</p>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        {t('Close', 'बंद करें')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
