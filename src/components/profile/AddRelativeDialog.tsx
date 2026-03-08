import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface AddRelativeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: {
    id: string;
    full_name: string;
    tree_id: string;
    user_id?: string | null;
  };
}

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', labelEn: 'I am their Parent', labelHi: 'मैं उनका माता/पिता हूँ' },
  { value: 'child', labelEn: 'I am their Child', labelHi: 'मैं उनका बच्चा हूँ' },
  { value: 'spouse', labelEn: 'I am their Spouse', labelHi: 'मैं उनका जीवनसाथी हूँ' },
  { value: 'sibling', labelEn: 'I am their Sibling', labelHi: 'मैं उनका भाई/बहन हूँ' },
];

const AddRelativeDialog = ({ isOpen, onClose, targetMember }: AddRelativeDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !relationship) return;

    setIsSubmitting(true);
    try {
      // Get user's profile to find their full_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('tree_link_requests')
        .insert({
          tree_id: targetMember.tree_id,
          requester_user_id: user.id,
          full_name: profile?.full_name || user.email || 'Unknown',
          target_member_id: targetMember.id,
          relationship_claim: relationship,
          admin_notes: notes || null,
        });

      if (error) throw error;

      toast.success(t(
        'Relative request sent! The family admin will review it.',
        'रिश्तेदार अनुरोध भेजा गया! परिवार का एडमिन इसकी समीक्षा करेगा।'
      ));
      onClose();
      setRelationship('');
      setNotes('');
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error(t('You have already sent a request to this family.', 'आपने पहले से इस परिवार को अनुरोध भेजा है।'));
      } else {
        toast.error(t('Failed to send request. Please try again.', 'अनुरोध भेजने में विफल। कृपया पुनः प्रयास करें।'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t('Add as Relative', 'रिश्तेदार के रूप में जोड़ें')}
          </DialogTitle>
          <DialogDescription>
            {t(
              `Send a request to join ${targetMember.full_name}'s family tree.`,
              `${targetMember.full_name} के वंशवृक्ष में शामिल होने का अनुरोध भेजें।`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('Your relationship', 'आपका रिश्ता')}
            </label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select relationship', 'रिश्ता चुनें')} />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelEn, opt.labelHi)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('Additional notes (optional)', 'अतिरिक्त नोट (वैकल्पिक)')}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('E.g., I am their elder brother...', 'जैसे, मैं उनका बड़ा भाई हूँ...')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('Cancel', 'रद्द करें')}
          </Button>
          <Button onClick={handleSubmit} disabled={!relationship || isSubmitting}>
            {isSubmitting ? t('Sending...', 'भेज रहे हैं...') : t('Send Request', 'अनुरोध भेजें')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRelativeDialog;
