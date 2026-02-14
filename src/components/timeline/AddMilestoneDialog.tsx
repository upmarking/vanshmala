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

interface AddMilestoneDialogProps {
    isOpen: boolean;
    onClose: () => void;
    memberId: string;
    onSuccess: () => void;
}

export const AddMilestoneDialog = ({ isOpen, onClose, memberId, onSuccess }: AddMilestoneDialogProps) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        event_type: 'other',
        description: '',
        media_url: '' // Simplified for MVP: single URL input or file upload later
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('timeline_events')
                .insert({
                    family_member_id: memberId,
                    title: formData.title,
                    date: formData.date ? new Date(formData.date).toISOString() : null,
                    event_type: formData.event_type,
                    description: formData.description,
                    media_urls: formData.media_url ? [{ url: formData.media_url, type: 'image' }] : [],
                    created_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;

            toast.success(t('Milestone added successfully', 'पड़ाव सफलतापूर्वक जोड़ा गया'));
            onSuccess();
            onClose();
            setFormData({ title: '', date: '', event_type: 'other', description: '', media_url: '' });
        } catch (error) {
            console.error('Error adding milestone:', error);
            toast.error(t('Failed to add milestone', 'पड़ाव जोड़ने में विफल'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('Add Life Milestone', 'जीवन का पड़ाव जोड़ें')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('Title', 'शीर्षक')}</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t('e.g., University Graduation', 'जैसे, विश्वविद्यालय स्नातक')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">{t('Date', 'तारीख')}</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">{t('Type', 'प्रकार')}</Label>
                            <Select
                                value={formData.event_type}
                                onValueChange={(val) => setFormData({ ...formData, event_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="birth">{t('Birth', 'जन्म')}</SelectItem>
                                    <SelectItem value="education">{t('Education', 'शिक्षा')}</SelectItem>
                                    <SelectItem value="career">{t('Career', 'करियर')}</SelectItem>
                                    <SelectItem value="marriage">{t('Marriage', 'विवाह')}</SelectItem>
                                    <SelectItem value="child">{t('Child Birth', 'संतान प्राप्ति')}</SelectItem>
                                    <SelectItem value="death">{t('Death', 'मृत्यु')}</SelectItem>
                                    <SelectItem value="other">{t('Other', 'अन्य')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">{t('Description', 'विवरण')}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('Add details about this event...', 'इस घटना के बारे में विवरण जोड़ें...')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="media">{t('Photo URL (Optional)', 'फोटो URL (वैकल्पिक)')}</Label>
                        <Input
                            id="media"
                            value={formData.media_url}
                            onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>{t('Cancel', 'रद्द करें')}</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            {t('Save Milestone', 'सहेजें')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
