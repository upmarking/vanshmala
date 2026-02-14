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
import { Loader2 } from 'lucide-react';

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
        unlock_date: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

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
                unlock_date: ''
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
