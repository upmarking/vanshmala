import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useAddMember, useSearchProfiles, useTreeMembers } from '@/hooks/useFamilyTree';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "@/integrations/supabase/types";
import { Search, User, Check } from 'lucide-react';

type RelationshipType = Database['public']['Enums']['relationship_type'];
type GenderType = Database['public']['Enums']['gender_type'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type FamilyMember = Database['public']['Tables']['family_members']['Row'];

interface AddMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
    treeId: string;
    relativeId?: string;
    relationType?: RelationshipType;
    relativeName?: string;
}

export const AddMemberDialog = ({ isOpen, onClose, treeId, relativeId, relationType, relativeName }: AddMemberDialogProps) => {
    const { t } = useLanguage();
    const { mutate: addMember, isPending } = useAddMember();

    const [activeTab, setActiveTab] = useState("new");
    const [formData, setFormData] = useState({
        fullName: '',
        fullNameHi: '',
        gender: 'male' as GenderType,
        isAlive: true,
        birthDate: '',
        deathDate: '',
        email: '',
        phone: '',
    });

    // Link Tab State
    const [linkRelationTo, setLinkRelationTo] = useState<string>(relativeId || '');
    const [linkRelationType, setLinkRelationType] = useState<RelationshipType>(relationType || 'child');

    // Fetch tree members for the dropdown
    const { data: treeData } = useTreeMembers(treeId);
    const treeMembers = treeData?.members || [];

    // Check for existing user by email/phone
    const [checkQuery, setCheckQuery] = useState('');
    const { data: checkResults } = useSearchProfiles(checkQuery);

    useEffect(() => {
        if (checkResults && checkResults.length > 0 && activeTab === 'new') {
            // Only alert if exact match on email or phone
            const match = checkResults.find(p =>
                (formData.email && p.email === formData.email) ||
                (formData.phone && p.phone === formData.phone)
            );

            if (match) {
                toast.info(
                    <div className="flex flex-col gap-2">
                        <p>{t(`User found: ${match.full_name}`, `उपयोगकर्ता मिला: ${match.full_name}`)}</p>
                        <Button size="sm" variant="outline" onClick={() => {
                            setSelectedProfile(match);
                            setActiveTab('link');
                            setFormData(prev => ({ ...prev, email: '', phone: '' })); // Clear to stop alert
                            setCheckQuery('');
                        }}>
                            {t('Link this user', 'इस उपयोगकर्ता को लिंक करें')}
                        </Button>
                    </div>,
                    { duration: 5000 }
                );
            }
        }
    }, [checkResults, formData.email, formData.phone, activeTab]);

    const handleCheckUser = () => {
        if (formData.email) setCheckQuery(formData.email);
        else if (formData.phone) setCheckQuery(formData.phone);
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const { data: searchResults, isLoading: isSearching } = useSearchProfiles(debouncedQuery);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                fullName: '',
                fullNameHi: '',
                gender: 'male' as GenderType,
                isAlive: true,
                birthDate: '',
                deathDate: '',
                email: '',
                phone: '',
            });
            if (relativeId) setLinkRelationTo(relativeId || '');
            if (relationType) setLinkRelationType(relationType || 'child');
            setSearchQuery('');
            setSelectedProfile(null);
            setActiveTab("new");
            setCheckQuery('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName.trim()) {
            toast.error(t('Name is required', 'नाम आवश्यक है'));
            return;
        }

        const memberData = {
            tree_id: treeId,
            full_name: formData.fullName,
            full_name_hi: formData.fullNameHi || null,
            gender: formData.gender,
            is_alive: formData.isAlive,
            date_of_birth: formData.birthDate || null,
            date_of_death: !formData.isAlive ? (formData.deathDate || null) : null
        };

        addMember(
            {
                memberData: memberData as any,
                relationToId: relativeId,
                relationType: relationType
            },
            {
                onSuccess: () => {
                    toast.success(t('Member added successfully', 'सदस्य सफलतापूर्वक जोड़ा गया'));
                    onClose();
                },
                onError: (error) => {
                    toast.error(t('Failed to add member: ' + error.message, 'सदस्य जोड़ने में विफल: ' + error.message));
                }
            }
        );
    };

    const handleLink = () => {
        if (!selectedProfile) return;

        const memberData = {
            tree_id: treeId,
            full_name: selectedProfile.full_name,
            full_name_hi: selectedProfile.full_name_hi,
            gender: selectedProfile.gender,
            is_alive: true,
            date_of_birth: selectedProfile.date_of_birth,
            vanshmala_id: selectedProfile.vanshmala_id,
            user_id: selectedProfile.user_id,
            avatar_url: selectedProfile.avatar_url
        };

        addMember(
            {
                memberData: memberData as any,
                relationToId: linkRelationTo,
                relationType: linkRelationType
            },
            {
                onSuccess: () => {
                    toast.success(t('Member linked successfully', 'सदस्य सफलतापूर्वक लिंक किया गया'));
                    onClose();
                },
                onError: (error) => {
                    toast.error(t('Failed to link member: ' + error.message, 'सदस्य लिंक करने में विफल: ' + error.message));
                }
            }
        );
    };

    const getDialogTitle = () => {
        if (!relationType || !relativeName) return t('Add Family Member', 'परिवार का सदस्य जोड़ें');

        const relMap: Record<string, string> = {
            'parent': t('Add Parent', 'माता-पिता जोड़ें'),
            'child': t('Add Child', 'बच्चा जोड़ें'),
            'spouse': t('Add Spouse', 'जीवनसाथी जोड़ें'),
            'sibling': t('Add Sibling', 'भाई-बहन जोड़ें')
        };

        return `${relMap[relationType] || t('Add Member', 'सदस्य जोड़ें')} ${t('to', 'के लिए')} ${relativeName}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{getDialogTitle()}</DialogTitle>
                    <DialogDescription>
                        {t(
                            "Add a new person to your family tree or link an existing profile.",
                            "अपने वंशवृक्ष में एक नया व्यक्ति जोड़ें या मौजूदा प्रोफ़ाइल लिंक करें।"
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new">{t('Create New', 'नया बनाएं')}</TabsTrigger>
                        <TabsTrigger value="link">{t('Link Existing', 'मौजूदा लिंक करें')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new">
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Full Name (English)', 'पूरा नाम (अंग्रेजी)')} *</label>
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Ramesh Sharma"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Full Name (Hindi)', 'पूरा नाम (हिंदी)')}</label>
                                    <Input
                                        value={formData.fullNameHi}
                                        onChange={(e) => setFormData({ ...formData, fullNameHi: e.target.value })}
                                        placeholder="रमेश शर्मा"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Email', 'ईमेल')}</label>
                                    <Input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        onBlur={handleCheckUser}
                                        placeholder="user@example.com"
                                        type="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Phone', 'फ़ोन')}</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        onBlur={handleCheckUser}
                                        placeholder="+91 9876543210"
                                        type="tel"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Gender', 'लिंग')}</label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(v: GenderType) => setFormData({ ...formData, gender: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('Male', 'पुरुष')}</SelectItem>
                                            <SelectItem value="female">{t('Female', 'महिला')}</SelectItem>
                                            <SelectItem value="other">{t('Other', 'अन्य')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Status', 'स्थिति')}</label>
                                    <Select
                                        value={formData.isAlive ? "alive" : "deceased"}
                                        onValueChange={(v) => setFormData({ ...formData, isAlive: v === "alive" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="alive">{t('Alive', 'जीवित')}</SelectItem>
                                            <SelectItem value="deceased">{t('Deceased', 'स्वर्गीय')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Date of Birth', 'जन्म तिथि')}</label>
                                    <Input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                                {!formData.isAlive && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('Date of Death', 'मृत्यु तिथि')}</label>
                                        <Input
                                            type="date"
                                            value={formData.deathDate}
                                            onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="link">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Related To', 'संबंधित')}</label>
                                    <Select value={linkRelationTo} onValueChange={setLinkRelationTo}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Member', 'सदस्य चुनें')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {treeMembers.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('Relationship', 'रिश्ता')}</label>
                                    <Select value={linkRelationType} onValueChange={(v: RelationshipType) => setLinkRelationType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parent">{t('Parent', 'माता-पिता')}</SelectItem>
                                            <SelectItem value="child">{t('Child', 'बच्चा')}</SelectItem>
                                            <SelectItem value="spouse">{t('Spouse', 'जीवनसाथी')}</SelectItem>
                                            <SelectItem value="sibling">{t('Sibling', 'भाई-बहन')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by Vanshmala ID or Phone', 'वंशमाला ID या फोन से खोजें')}
                                    className="pl-9"
                                />
                            </div>

                            {isSearching ? (
                                <div className="text-center py-4 text-muted-foreground">{t('Searching...', 'खोज रहे हैं...')}</div>
                            ) : searchResults && searchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {searchResults.map(profile => {
                                        const isAlreadyMember = treeMembers.some(m =>
                                            (m.user_id && m.user_id === profile.user_id) ||
                                            (m.vanshmala_id && m.vanshmala_id === profile.vanshmala_id)
                                        );

                                        return (
                                            <div
                                                key={profile.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isAlreadyMember
                                                        ? 'opacity-50 cursor-not-allowed border-dashed'
                                                        : selectedProfile?.id === profile.id
                                                            ? 'border-saffron bg-saffron/5 ring-1 ring-saffron cursor-pointer'
                                                            : 'border-border hover:border-saffron/50 cursor-pointer'
                                                    }`}
                                                onClick={() => !isAlreadyMember && setSelectedProfile(profile)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm text-foreground truncate">{profile.full_name}</p>
                                                        {isAlreadyMember && (
                                                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                                                {t('Added', 'जोड़ा गया')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{profile.vanshmala_id}</p>
                                                </div>
                                                {selectedProfile?.id === profile.id && !isAlreadyMember && (
                                                    <Check className="w-5 h-5 text-saffron" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : searchQuery.length >= 3 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('No profiles found', 'कोई प्रोफ़ाइल नहीं मिली')}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {t('Type at least 3 characters to search', 'खोजने के लिए कम से कम 3 अक्षर टाइप करें')}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t('Cancel', 'रद्द करें')}</Button>
                    {activeTab === 'new' ? (
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending ? t('Adding...', 'जोड़ रहे हैं...') : t('Add Member', 'सदस्य जोड़ें')}
                        </Button>
                    ) : (
                        <Button onClick={handleLink} disabled={isPending || !selectedProfile || !linkRelationTo || !linkRelationType}>
                            {isPending ? t('Linking...', 'लिंक हो रहा है...') : t('Link Selected', 'चयनित को लिंक करें')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
