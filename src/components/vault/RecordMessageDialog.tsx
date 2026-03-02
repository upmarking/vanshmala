import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Users, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTrees, useTreeMembers } from '@/hooks/useFamilyTree';

interface RecordMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RecordMessageDialog = ({ isOpen, onClose, onSuccess }: RecordMessageDialogProps) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content_type: 'text',
        message_text: '',
        media_url: '',
        unlock_condition: 'date',
        unlock_date: '',
        target_family_member_id: ''
    });

    const { user } = useAuth();
    const { data: userTrees } = useUserTrees(user?.id);
    const treeId = userTrees?.[0]?.tree_id;
    const { data: treeData } = useTreeMembers(treeId || '');
    const members = treeData?.members || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const targetMember = members.find(m => m.id === formData.target_family_member_id);
            const recipientId = targetMember?.user_id || null;

            const { error } = await supabase
                .from('legacy_messages')
                .insert({
                    creator_id: user.id,
                    title: formData.title,
                    content_type: formData.content_type,
                    message_text: formData.message_text,
                    media_url: formData.media_url,
                    unlock_condition: formData.unlock_condition,
                    unlock_date: formData.unlock_date ? new Date(formData.unlock_date).toISOString() : null,
                    recipient_id: recipientId,
                    target_family_member_id: formData.target_family_member_id || null,
                    is_unlocked: false // Default to locked
                });

            if (error) throw error;

            toast.success(t('Message recorded securely', 'संदेश सुरक्षित रूप से रिकॉर्ड किया गया'));
            onSuccess();
            onClose();
            setFormData({
                title: '',
                content_type: 'text',
                message_text: '',
                media_url: '',
                unlock_condition: 'date',
                unlock_date: '',
                target_family_member_id: ''
            });
        } catch (error) {
            console.error('Error recording message:', error);
            toast.error(t('Failed to save message', 'संदेश सहेजने में विफल'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('Record Legacy Message', 'विरासत संदेश रिकॉर्ड करें')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('Title', 'शीर्षक')}</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t('For my grandson on his 18th birthday', 'मेरे पोते के 18वें जन्मदिन के लिए')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recipient">{t('Who is this for?', 'यह किसके लिए है?')}</Label>
                        <Select
                            value={formData.target_family_member_id || 'all'}
                            onValueChange={(val) => setFormData({ ...formData, target_family_member_id: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>{t('All Family Members', 'सभी परिवार के सदस्य')}</span>
                                    </div>
                                </SelectItem>
                                {members.filter(m => m.user_id !== user?.id).map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                                            <span>{member.full_name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground leading-tight italic">
                            {formData.target_family_member_id
                                ? t('Only this person will see the message in their vault.', 'केवल यही व्यक्ति अपनी तिजोरी में संदेश देख पाएगा।')
                                : t('Anyone in your family tree will be able to see this.', 'आपके परिवार के पेड़ का कोई भी सदस्य इसे देख पाएगा।')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">{t('Message Type', 'संदेश प्रकार')}</Label>
                            <Select
                                value={formData.content_type}
                                onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">{t('Text Letter', 'पाठ पत्र')}</SelectItem>
                                    <SelectItem value="audio">{t('Audio Recording', 'ऑडियो रिकॉर्डिंग')}</SelectItem>
                                    <SelectItem value="video">{t('Video Message', 'वीडियो संदेश')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unlock">{t('Unlock Condition', 'अनलॉक शर्त')}</Label>
                            <Select
                                value={formData.unlock_condition}
                                onValueChange={(val) => setFormData({ ...formData, unlock_condition: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">{t('Specific Date', 'विशिष्ट तारीख')}</SelectItem>
                                    <SelectItem value="after_death">{t('After My Passing', 'मेरे जाने के बाद')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.unlock_condition === 'date' && (
                        <div className="space-y-2">
                            <Label htmlFor="unlockDate">{t('Unlock Date', 'अनलॉक तारीख')}</Label>
                            <Input
                                id="unlockDate"
                                type="date"
                                required
                                value={formData.unlock_date}
                                onChange={(e) => setFormData({ ...formData, unlock_date: e.target.value })}
                            />
                        </div>
                    )}

                    {formData.content_type === 'text' ? (
                        <div className="space-y-2">
                            <Label htmlFor="message">{t('Message', 'संदेश')}</Label>
                            <Textarea
                                id="message"
                                required
                                className="min-h-[150px]"
                                value={formData.message_text}
                                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                                placeholder={t('Write your blessing here...', 'अपना आशीर्वाद यहाँ लिखें...')}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="media">{t('Media URL (Upload not implemented in MVP)', 'मीडिया URL (अपलोड अभी लागू नहीं)')}</Label>
                            <Input
                                id="media"
                                required
                                value={formData.media_url}
                                onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">{t('Provide a direct link to your audio/video file.', 'अपनी ऑडियो/वीडियो फ़ाइल का सीधा लिंक प्रदान करें।')}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>{t('Cancel', 'रद्द करें')}</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            {t('Secure in Vault', 'तिजोरी में सुरक्षित करें')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
