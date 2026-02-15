import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Copy, Check } from 'lucide-react';

interface GiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: number;
  onSuccess: () => void;
}

const GiftCardDialog = ({ open, onOpenChange, walletBalance, onSuccess }: GiftCardDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [giftAmount, setGiftAmount] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GC-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreateGiftCard = async () => {
    const amount = parseFloat(giftAmount);
    if (!amount || amount < 10) {
      toast.error(t('Minimum ₹10 for gift card', 'गिफ्ट कार्ड के लिए न्यूनतम ₹10'));
      return;
    }
    if (amount > walletBalance) {
      toast.error(t('Insufficient balance', 'अपर्याप्त शेष राशि'));
      return;
    }

    setProcessing(true);
    const code = generateCode();

    // Deduct from wallet
    const { data: deducted } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: user!.id,
      p_amount: amount,
      p_description: `Gift card created: ${code}`,
      p_description_hi: `गिफ्ट कार्ड बनाया: ${code}`,
      p_reference_type: 'gift_card',
      p_reference_id: code,
    });

    if (!deducted) {
      toast.error(t('Failed to deduct balance', 'शेष कटौती विफल'));
      setProcessing(false);
      return;
    }

    // Create gift card
    const { error } = await supabase.from('gift_cards' as any).insert({
      code,
      amount,
      created_by: user!.id,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    });

    if (error) {
      toast.error(t('Failed to create gift card', 'गिफ्ट कार्ड बनाने में विफल'));
    } else {
      setGeneratedCode(code);
      toast.success(t('Gift card created!', 'गिफ्ट कार्ड बनाया गया!'));
      onSuccess();
    }
    setProcessing(false);
  };

  const handleRedeemGiftCard = async () => {
    if (!redeemCode.trim()) {
      toast.error(t('Enter a gift card code', 'गिफ्ट कार्ड कोड दर्ज करें'));
      return;
    }

    setProcessing(true);
    const { data, error } = await supabase.rpc('redeem_gift_card' as any, {
      p_code: redeemCode.trim().toUpperCase(),
      p_user_id: user!.id,
    });

    const result = data as any;
    if (error || !result?.success) {
      toast.error(t(result?.error || 'Redemption failed', result?.error || 'भुनाने में विफल'));
    } else {
      toast.success(t(`₹${result.amount} added from gift card!`, `गिफ्ट कार्ड से ₹${result.amount} जोड़े गए!`));
      setRedeemCode('');
      onOpenChange(false);
      onSuccess();
    }
    setProcessing(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setGeneratedCode(''); setGiftAmount(''); setRedeemCode(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {t('Gift Card', 'गिफ्ट कार्ड')}
          </DialogTitle>
          <DialogDescription>{t('Create or redeem a one-time use gift card', 'एक बार उपयोग वाला गिफ्ट कार्ड बनाएं या भुनाएं')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{t('Create', 'बनाएं')}</TabsTrigger>
            <TabsTrigger value="redeem">{t('Redeem', 'भुनाएं')}</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 pt-2">
            {generatedCode ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">{t('Your gift card code:', 'आपका गिफ्ट कार्ड कोड:')}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-bold text-primary tracking-wider">{generatedCode}</span>
                  <Button variant="ghost" size="icon" onClick={copyCode}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('Valid for 90 days. One-time use only.', '90 दिनों के लिए मान्य। केवल एक बार उपयोग।')}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {[50, 100, 500].map((amt) => (
                    <Button key={amt} variant="outline" size="sm" onClick={() => setGiftAmount(String(amt))}>₹{amt}</Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  placeholder={t('Enter amount (min ₹10)', 'राशि दर्ज करें (न्यूनतम ₹10)')}
                  min="10"
                />
                <p className="text-xs text-muted-foreground">{t('Balance: ', 'शेष: ')}₹{walletBalance.toFixed(2)}</p>
                <Button onClick={handleCreateGiftCard} disabled={processing} className="w-full bg-gradient-saffron text-primary-foreground">
                  {processing ? t('Creating...', 'बना रहे हैं...') : t('Create Gift Card', 'गिफ्ट कार्ड बनाएं')}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="redeem" className="space-y-4 pt-2">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder={t('Enter gift card code', 'गिफ्ट कार्ड कोड दर्ज करें')}
              className="font-mono tracking-wider"
            />
            <Button onClick={handleRedeemGiftCard} disabled={processing} className="w-full bg-gradient-saffron text-primary-foreground">
              {processing ? t('Redeeming...', 'भुना रहे हैं...') : t('Redeem Gift Card', 'गिफ्ट कार्ड भुनाएं')}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GiftCardDialog;
