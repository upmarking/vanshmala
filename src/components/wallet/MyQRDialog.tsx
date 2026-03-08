import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface MyQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MyQRDialog = ({ open, onOpenChange }: MyQRDialogProps) => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  const qrValue = `vanshmala://pay?id=${encodeURIComponent(profile?.vanshmala_id || '')}&name=${encodeURIComponent(profile?.full_name || '')}`;

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 750;

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.roundRect(0, 0, 600, 750, 24);
      ctx.fill();

      // Header text
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Vanshmala Pay', 300, 50);

      // Name
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(profile?.full_name || '', 300, 90);

      // VM ID
      ctx.fillStyle = '#666';
      ctx.font = '16px monospace';
      ctx.fillText(profile?.vanshmala_id || '', 300, 115);

      // QR code
      ctx.drawImage(img, 100, 140, 400, 400);

      // Footer
      ctx.fillStyle = '#999';
      ctx.font = '14px system-ui';
      ctx.fillText(t('Scan to pay via Dhan wallet', 'धन वॉलेट से भुगतान करने के लिए स्कैन करें'), 300, 590);

      const link = document.createElement('a');
      link.download = `vanshmala-qr-${profile?.vanshmala_id || 'code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('QR code downloaded!', 'QR कोड डाउनलोड हो गया!'));
    };
    img.src = url;
  }, [profile, t]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('My Vanshmala Pay QR', 'मेरा वंशमाला पे QR'),
          text: t(
            `Pay ${profile?.full_name} on Vanshmala! ID: ${profile?.vanshmala_id}`,
            `वंशमाला पर ${profile?.full_name} को भुगतान करें! ID: ${profile?.vanshmala_id}`
          ),
        });
      } catch {
        // User cancelled
      }
    } else {
      handleDownload();
    }
  }, [profile, t, handleDownload]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t('My QR Code', 'मेरा QR कोड')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('Others can scan this to pay you', 'दूसरे इसे स्कैन करके आपको भुगतान कर सकते हैं')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* User info */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-display font-semibold text-foreground">{profile?.full_name}</p>
              <p className="text-xs font-mono text-muted-foreground">{profile?.vanshmala_id}</p>
            </div>
          </div>

          {/* QR Code */}
          <div ref={qrRef} className="p-4 bg-card rounded-2xl border border-border shadow-sm">
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="H"
              includeMargin
              fgColor="hsl(var(--foreground))"
              bgColor="transparent"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t('Scan to pay via Dhan wallet', 'धन वॉलेट से भुगतान करने के लिए स्कैन करें')}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              {t('Save', 'सेव करें')}
            </Button>
            <Button className="flex-1 gap-2 bg-gradient-saffron text-primary-foreground" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              {t('Share', 'शेयर')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyQRDialog;
