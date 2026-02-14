import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineView } from '@/components/timeline/TimelineView';
import { Button } from '@/components/ui/button';
import { FamilyTreeNode } from '@/utils/familyTreeUtils';
import { User, GitMerge } from 'lucide-react';
import { useMergeRequests } from '@/hooks/useMergeRequests';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTreeMembers } from '@/hooks/useFamilyTree';
import { TagSelector } from '@/components/tags/TagSelector';
import { toast } from 'sonner';

interface MemberProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: FamilyTreeNode | null;
    treeId: string;
}

export const MemberProfileDialog = ({ isOpen, onClose, member, treeId }: MemberProfileDialogProps) => {
    const { t } = useLanguage();
    const { createRequest } = useMergeRequests(treeId);
    const { data: treeData } = useTreeMembers(treeId);

    const [showMerge, setShowMerge] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');

    const handleMerge = () => {
        if (!selectedTargetId || !member) return;

        createRequest.mutate({
            tree_id: treeId,
            source_member_id: member.id, // The one we are viewing is Source? Or Target?
            // Usually "This profile is a duplicate of THAT profile".
            // So current profile -> Source (to be deleted).
            // Target -> The one to keep.
            target_member_id: selectedTargetId,
            status: 'pending'
        }, {
            onSuccess: () => {
                setShowMerge(false);
                onClose();
            }
        });
    };

    if (!member) return null;

    // Filter out current member from targets
    const potentialTargets = treeData?.members?.filter(m => m.id !== member.id) || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t('Member Details', 'सदस्य विवरण')}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">{t('Profile', 'प्रोफ़ाइल')}</TabsTrigger>
                        <TabsTrigger value="timeline">{t('Timeline', 'समयरेखा')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-24 h-24 rounded-full bg-saffron/10 flex items-center justify-center border-4 border-background shadow-lg">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-saffron" />
                                )}
                            </div>

                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-bold font-display">{member.full_name}</h2>
                                {member.full_name_hi && (
                                    <p className="text-lg text-muted-foreground font-body">{member.full_name_hi}</p>
                                )}
                            </div>

                            <div className="w-full space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">{t('Vanshmala ID', 'वंशमाला ID')}</div>
                                    <div className="font-medium text-right">{member.vanshmala_id}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">{t('Gender', 'लिंग')}</div>
                                    <div className="font-medium text-right capitalize">{t(member.gender || 'Unknown', member.gender === 'male' ? 'पुरुष' : member.gender === 'female' ? 'महिला' : 'अन्य')}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">{t('Status', 'स्थिति')}</div>
                                    <div className="font-medium text-right">
                                        {member.is_alive ?
                                            <span className="text-green-600">{t('Alive', 'जीवित')}</span> :
                                            <span className="text-muted-foreground">{t('Deceased', 'स्वर्गीय')}</span>
                                        }
                                    </div>
                                </div>

                                {member.date_of_birth && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-muted-foreground">{t('Date of Birth', 'जन्म तिथि')}</div>
                                        <div className="font-medium text-right">{new Date(member.date_of_birth).toLocaleDateString()}</div>
                                    </div>
                                )}

                                {!member.is_alive && member.date_of_death && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-muted-foreground">{t('Date of Death', 'मृत्यु तिथि')}</div>
                                        <div className="font-medium text-right">{new Date(member.date_of_death).toLocaleDateString()}</div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">{t('Generation', 'पीढ़ी')}</div>
                                    <div className="font-medium text-right">{member.generation_level}</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full px-6 py-2">
                            <div className="bg-muted/30 rounded-lg p-3">
                                <h3 className="text-sm font-medium mb-2 text-muted-foreground">{t('Tags', 'टैग')}</h3>
                                <TagSelector treeId={treeId} profileId={member.id} />
                            </div>
                        </div>

                        {/* Actions moved inside profile tab */}
                        <div className="w-full pt-4 border-t mt-4">
                            {!showMerge ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground hover:text-destructive"
                                    onClick={() => setShowMerge(true)}
                                >
                                    <GitMerge className="w-4 h-4 mr-2" />
                                    {t('Identify as Duplicate', 'डुप्लिकेट के रूप में पहचानें')}
                                </Button>
                            ) : (
                                <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                                    <p className="text-sm font-medium">{t('Merge this profile into:', 'इस प्रोफ़ाइल को इसमें मिलाएँ:')}</p>
                                    <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select original profile', 'मूल प्रोफ़ाइल चुनें')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {potentialTargets.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.full_name} ({t.vanshmala_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setShowMerge(false)}>
                                            {t('Cancel', 'रद्द करें')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleMerge}
                                            disabled={!selectedTargetId || createRequest.isPending}
                                        >
                                            {createRequest.isPending ? t('Requesting...', 'अनुरोध कर रहा है...') : t('Request Merge', 'विलय अनुरोध')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="flex-1 overflow-hidden h-full">
                        {/* We pass member.id, ensuring it's not null (checked at start of component) */}
                        <TimelineView memberId={member.id} isEditable={true} />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-center mt-2">
                    <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                        {t('Close', 'बंद करें')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
