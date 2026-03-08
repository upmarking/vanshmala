import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareTreeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
}

export const ShareTreeDialog = ({ isOpen, onClose, treeId }: ShareTreeDialogProps) => {
  const { t } = useLanguage();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_or_create_share_token', { p_tree_id: treeId });
    if (error) {
      toast.error(t('Failed to generate share link', 'शेयर लिंक बनाने में विफल'));
      setLoading(false);
      return;
    }
    const url = `${window.location.origin}/shared-tree/${data}`;
    setShareUrl(url);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('Link copied!', 'लिंक कॉपी हो गया!'));
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(t(
      `Check out our family tree on VanshMala! 🌳\n${shareUrl}`,
      `वंशमाला पर हमारा वंशवृक्ष देखें! 🌳\n${shareUrl}`
    ));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t('Share Family Tree', 'वंशवृक्ष शेयर करें')}
          </DialogTitle>
          <DialogDescription>
            {t('Generate a public read-only link to share with family.', 'परिवार के साथ शेयर करने के लिए एक पब्लिक रीड-ओनली लिंक बनाएं।')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <Button onClick={generateLink} disabled={loading} className="w-full bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('Generate Public Link', 'पब्लिक लिंक बनाएं')}
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button onClick={handleWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                📱 {t('Share on WhatsApp', 'WhatsApp पर शेयर करें')}
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {t('Anyone with this link can view names & relationships (no private info).', 'इस लिंक वाला कोई भी व्यक्ति नाम और रिश्ते देख सकता है (कोई निजी जानकारी नहीं)।')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
