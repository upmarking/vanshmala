import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineView } from '@/components/timeline/TimelineView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FamilyTreeNode, getGenerationName } from '@/utils/familyTreeUtils';
import { User, GitMerge, Trash2, Link, X, Plus } from 'lucide-react';
import { useMergeRequests } from '@/hooks/useMergeRequests';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    useTreeMembers, useDelinkMember, useIsTreeAdmin,
    useUpdateMember, useAddRelationship, useRemoveRelationship
} from '@/hooks/useFamilyTree';
import { useAuth } from '@/contexts/AuthContext';
import { TagSelector } from '@/components/tags/TagSelector';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type RelationshipType = Database['public']['Enums']['relationship_type'];
type GenderType = Database['public']['Enums']['gender_type'];

interface MemberProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: FamilyTreeNode | null;
    treeId: string;
}

export const MemberProfileDialog = ({ isOpen, onClose, member, treeId }: MemberProfileDialogProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { createRequest } = useMergeRequests(treeId);
    const { data: treeData } = useTreeMembers(treeId);
    const { data: isAdmin } = useIsTreeAdmin(treeId, user?.id);
    const delinkMutation = useDelinkMember();
    const updateMutation = useUpdateMember();
    const addRelMutation = useAddRelationship();
    const removeRelMutation = useRemoveRelationship();

    const [showMerge, setShowMerge] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editNameHi, setEditNameHi] = useState('');
    const [editGender, setEditGender] = useState<GenderType>('male');
    const [editDob, setEditDob] = useState('');
    const [editDod, setEditDod] = useState('');
    const [editIsAlive, setEditIsAlive] = useState(true);

    // Assign relationship state
    const [assignToMemberId, setAssignToMemberId] = useState('');
    const [assignRelType, setAssignRelType] = useState<RelationshipType>('child');

    // Populate edit fields when member changes
    useEffect(() => {
        if (member) {
            setEditName(member.full_name || '');
            setEditNameHi(member.full_name_hi || '');
            setEditGender((member.gender as GenderType) || 'male');
            setEditDob(member.date_of_birth || '');
            setEditDod(member.date_of_death || '');
            setEditIsAlive(member.is_alive ?? true);
            setAssignToMemberId('');
            setAssignRelType('child');
            setShowMerge(false);
            setSelectedTargetId('');
        }
    }, [member?.id, isOpen]);

    const handleRemove = async () => {
        if (!member || !window.confirm(t(
            'Are you sure you want to remove this member from the tree? This cannot be undone.',
            'क्या आप वाकई इस सदस्य को पेड़ से हटाना चाहते हैं? यह पूर्ववत नहीं किया जा सकता।'
        ))) return;

        delinkMutation.mutate({ memberId: member.id }, {
            onSuccess: () => {
                toast.success(t('Member removed from tree', 'सदस्य पेड़ से हटा दिया गया'));
                onClose();
            },
            onError: (err) => {
                toast.error(t('Failed to remove member', 'सदस्य हटाने में विफल'));
                console.error(err);
            }
        });
    };

    const handleSaveEdit = () => {
        if (!member || !editName.trim()) return;
        updateMutation.mutate({
            memberId: member.id,
            updates: {
                full_name: editName.trim(),
                full_name_hi: editNameHi.trim() || null,
                gender: editGender,
                is_alive: editIsAlive,
                date_of_birth: editDob || null,
                date_of_death: !editIsAlive ? (editDod || null) : null,
            }
        }, {
            onSuccess: () => toast.success(t('Member updated', 'सदस्य अपडेट किया गया')),
            onError: () => toast.error(t('Failed to update member', 'सदस्य अपडेट करने में विफल')),
        });
    };

    const handleAssignRelationship = () => {
        if (!member || !assignToMemberId) return;

        // Determine from/to based on relationship semantics
        let fromId = member.id;
        let toId = assignToMemberId;
        let relType: RelationshipType = assignRelType;

        if (assignRelType === 'parent') {
            // This member IS the parent of the selected member
            fromId = member.id;
            toId = assignToMemberId;
            relType = 'parent';
        } else if (assignRelType === 'child') {
            // This member IS the child of the selected member
            fromId = assignToMemberId;
            toId = member.id;
            relType = 'parent'; // stored as parent direction
        } else if (assignRelType === 'spouse' || assignRelType === 'sibling') {
            fromId = member.id;
            toId = assignToMemberId;
            relType = assignRelType;
        }

        addRelMutation.mutate({ treeId, fromMemberId: fromId, toMemberId: toId, relationship: relType }, {
            onSuccess: () => {
                toast.success(t('Relationship added', 'रिश्ता जोड़ा गया'));
                setAssignToMemberId('');
            },
            onError: (err: any) => {
                const msg = err?.message?.includes('unique')
                    ? t('This relationship already exists', 'यह रिश्ता पहले से मौजूद है')
                    : t('Failed to add relationship', 'रिश्ता जोड़ने में विफल');
                toast.error(msg);
            }
        });
    };

    const handleRemoveRelationship = (relId: string) => {
        if (!window.confirm(t('Remove this relationship?', 'इस रिश्ते को हटाएं?'))) return;
        removeRelMutation.mutate({ relationshipId: relId, treeId }, {
            onSuccess: () => toast.success(t('Relationship removed', 'रिश्ता हटाया गया')),
            onError: () => toast.error(t('Failed to remove relationship', 'रिश्ता हटाने में विफल')),
        });
    };

    const handleMerge = () => {
        if (!selectedTargetId || !member) return;
        createRequest.mutate({
            tree_id: treeId,
            source_member_id: member.id,
            target_member_id: selectedTargetId,
            status: 'pending'
        }, {
            onSuccess: () => { setShowMerge(false); onClose(); }
        });
    };

    if (!member) return null;

    const potentialTargets = treeData?.members?.filter(m => m.id !== member.id) || [];
    const relationships = treeData?.relationships || [];

    // Find all relationships for this member
    const memberRels = relationships.filter(r =>
        r.from_member_id === member.id || r.to_member_id === member.id
    );

    const isOrphan = (member.parents?.length === 0 || !member.parents) &&
        (member.children?.length === 0 || !member.children) &&
        !member.spouse;

    const relLabel = (rel: typeof relationships[0]) => {
        const isSelf = rel.from_member_id === member.id;
        const otherId = isSelf ? rel.to_member_id : rel.from_member_id;
        const other = treeData?.members?.find(m => m.id === otherId);
        const name = other?.full_name || t('Unknown', 'अज्ञात');

        if (rel.relationship === 'parent') {
            return isSelf
                ? `${t('Parent of', 'माता-पिता')} ${name}`
                : `${t('Child of', 'की संतान')} ${name}`;
        }
        if (rel.relationship === 'spouse') return `${t('Spouse', 'जीवनसाथी')}: ${name}`;
        if (rel.relationship === 'sibling') return `${t('Sibling', 'भाई-बहन')}: ${name}`;
        return name;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {member.full_name}
                        {isOrphan && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-300">
                                {t('Unconnected', 'असंबद्ध')}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">{t('Profile', 'प्रोफ़ाइल')}</TabsTrigger>
                        <TabsTrigger value="edit">{t('Edit', 'संपादन')}</TabsTrigger>
                        <TabsTrigger value="timeline">{t('Timeline', 'समयरेखा')}</TabsTrigger>
                    </TabsList>

                    {/* ── PROFILE TAB ── */}
                    <TabsContent value="profile" className="flex-1 overflow-y-auto py-4 space-y-4">
                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-20 h-20 rounded-full bg-saffron/10 flex items-center justify-center border-4 border-background shadow-lg">
                                {member.avatar_url
                                    ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                    : <User className="w-9 h-9 text-saffron" />
                                }
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold font-display">{member.full_name}</h2>
                                {member.full_name_hi && <p className="text-base text-muted-foreground font-body">{member.full_name_hi}</p>}
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 rounded-xl p-3">
                            <div className="text-muted-foreground">{t('Vanshmala ID', 'वंशमाला ID')}</div>
                            <div className="font-medium text-right">{member.vanshmala_id || '—'}</div>

                            <div className="text-muted-foreground">{t('Gender', 'लिंग')}</div>
                            <div className="font-medium text-right capitalize">{member.gender || t('Unknown', 'अज्ञात')}</div>

                            <div className="text-muted-foreground">{t('Status', 'स्थिति')}</div>
                            <div className="font-medium text-right">
                                {member.is_alive
                                    ? <span className="text-green-600">{t('Alive', 'जीवित')}</span>
                                    : <span className="text-muted-foreground">{t('Deceased', 'स्वर्गीय')}</span>
                                }
                            </div>

                            {member.date_of_birth && <>
                                <div className="text-muted-foreground">{t('Born', 'जन्म')}</div>
                                <div className="font-medium text-right">{new Date(member.date_of_birth).toLocaleDateString('en-IN')}</div>
                            </>}
                            {!member.is_alive && member.date_of_death && <>
                                <div className="text-muted-foreground">{t('Died', 'मृत्यु')}</div>
                                <div className="font-medium text-right">{new Date(member.date_of_death).toLocaleDateString('en-IN')}</div>
                            </>}

                            <div className="text-muted-foreground">{t('Generation', 'पीढ़ी')}</div>
                            <div className="font-medium text-right">
                                {(() => {
                                    const genName = getGenerationName(member.date_of_birth);
                                    if (genName) return t(genName, genName);
                                    return (
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-blue-600 text-sm font-medium"
                                            onClick={() => document.querySelector<HTMLButtonElement>('[value="edit"]')?.click()}
                                        >
                                            {t('Set up Date of Birth please', 'कृपया जन्म तिथि सेट करें')}
                                        </Button>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-muted/30 rounded-xl p-3">
                            <h3 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">{t('Tags', 'टैग')}</h3>
                            <TagSelector treeId={treeId} profileId={member.id} />
                        </div>

                        {/* Relationships */}
                        <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Relationships', 'रिश्ते')}</h3>
                            {memberRels.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">{t('No relationships yet. Use "Assign" below to connect.', 'अभी कोई रिश्ता नहीं। नीचे "जोड़ें" से कनेक्ट करें।')}</p>
                            ) : memberRels.map(rel => (
                                <div key={rel.id} className="flex items-center justify-between text-sm">
                                    <span>{relLabel(rel)}</span>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleRemoveRelationship(rel.id)}
                                            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Assign Relationship */}
                        <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Link className="w-3.5 h-3.5" />
                                {t('Assign Relationship', 'रिश्ता असाइन करें')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t(`${member.full_name} is a`, `${member.full_name} है एक`)}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={assignRelType} onValueChange={(v: RelationshipType) => setAssignRelType(v)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="parent">{t('Parent of →', 'माता-पिता →')}</SelectItem>
                                        <SelectItem value="child">{t('Child of ←', 'संतान ←')}</SelectItem>
                                        <SelectItem value="spouse">{t('Spouse of ↔', 'जीवनसाथी ↔')}</SelectItem>
                                        <SelectItem value="sibling">{t('Sibling of ↔', 'भाई-बहन ↔')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={assignToMemberId} onValueChange={setAssignToMemberId}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={t('Select person', 'व्यक्ति चुनें')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {potentialTargets.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.full_name} {m.vanshmala_id ? `(${m.vanshmala_id})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={handleAssignRelationship}
                                disabled={!assignToMemberId || addRelMutation.isPending}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                {addRelMutation.isPending ? t('Adding...', 'जोड़ रहे हैं...') : t('Add Relationship', 'रिश्ता जोड़ें')}
                            </Button>
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                            <div className="border-t pt-3 space-y-2">
                                {!showMerge ? (
                                    <>
                                        <Button
                                            variant="ghost" size="sm"
                                            className="w-full text-muted-foreground hover:text-primary"
                                            onClick={() => setShowMerge(true)}
                                        >
                                            <GitMerge className="w-4 h-4 mr-2" />
                                            {t('Identify as Duplicate', 'डुप्लिकेट के रूप में पहचानें')}
                                        </Button>
                                        <Button
                                            variant="ghost" size="sm"
                                            className="w-full text-muted-foreground hover:text-destructive"
                                            onClick={handleRemove}
                                            disabled={delinkMutation.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {delinkMutation.isPending ? t('Removing...', 'हटा रहे हैं...') : t('Remove from Tree', 'पेड़ से हटाएं')}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="space-y-3 bg-muted/30 p-3 rounded-xl">
                                        <p className="text-sm font-medium">{t('Merge this into:', 'इसे इसमें मिलाएँ:')}</p>
                                        <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select original', 'मूल चुनें')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {potentialTargets.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.full_name} ({m.vanshmala_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setShowMerge(false)}>
                                                {t('Cancel', 'रद्द करें')}
                                            </Button>
                                            <Button size="sm" onClick={handleMerge} disabled={!selectedTargetId || createRequest.isPending}>
                                                {createRequest.isPending ? t('Requesting...', 'अनुरोध...') : t('Request Merge', 'मर्ज अनुरोध')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── EDIT TAB ── */}
                    <TabsContent value="edit" className="flex-1 overflow-y-auto py-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t('Full Name (English)', 'पूरा नाम (अंग्रेजी)')} *</label>
                                    <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ramesh Sharma" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t('Full Name (Hindi)', 'पूरा नाम (हिंदी)')}</label>
                                    <Input value={editNameHi} onChange={e => setEditNameHi(e.target.value)} placeholder="रमेश शर्मा" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t('Gender', 'लिंग')}</label>
                                    <Select value={editGender} onValueChange={(v: GenderType) => setEditGender(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('Male', 'पुरुष')}</SelectItem>
                                            <SelectItem value="female">{t('Female', 'महिला')}</SelectItem>
                                            <SelectItem value="other">{t('Other', 'अन्य')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t('Status', 'स्थिति')}</label>
                                    <Select value={editIsAlive ? 'alive' : 'deceased'} onValueChange={v => setEditIsAlive(v === 'alive')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="alive">{t('Alive', 'जीवित')}</SelectItem>
                                            <SelectItem value="deceased">{t('Deceased', 'स्वर्गीय')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t('Date of Birth', 'जन्म तिथि')}</label>
                                    <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
                                </div>
                                {!editIsAlive && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">{t('Date of Death', 'मृत्यु तिथि')}</label>
                                        <Input type="date" value={editDod} onChange={e => setEditDod(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleSaveEdit}
                                disabled={!editName.trim() || updateMutation.isPending}
                            >
                                {updateMutation.isPending ? t('Saving...', 'सहेज रहे हैं...') : t('Save Changes', 'बदलाव सहेजें')}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ── TIMELINE TAB ── */}
                    <TabsContent value="timeline" className="flex-1 overflow-hidden h-full">
                        <TimelineView memberId={member.id} isEditable={true} />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-2">
                    <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                        {t('Close', 'बंद करें')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
