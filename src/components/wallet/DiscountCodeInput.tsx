import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Check, X } from 'lucide-react';

interface DiscountResult {
  valid: boolean;
  discount_amount?: number;
  discount_id?: string;
  percentage?: number;
  error?: string;
}

interface DiscountCodeInputProps {
  amount: number;
  onDiscountApplied: (discount: { amount: number; codeId: string; code: string } | null) => void;
}

const DiscountCodeInput = ({ amount, onDiscountApplied }: DiscountCodeInputProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [applied, setApplied] = useState<{ amount: number; percentage: number; code: string } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    if (!amount || amount < 1) {
      toast.error(t('Enter amount first', 'पहले राशि दर्ज करें'));
      return;
    }

    setChecking(true);
    const { data, error } = await supabase.rpc('validate_discount_code' as any, {
      p_code: code.trim().toUpperCase(),
      p_amount: amount,
      p_user_id: user!.id,
    });

    const result = data as unknown as DiscountResult;
    if (error || !result?.valid) {
      toast.error(t(result?.error || 'Invalid code', result?.error || 'अमान्य कोड'));
      onDiscountApplied(null);
      setApplied(null);
    } else {
      setApplied({ amount: result.discount_amount!, percentage: result.percentage!, code: code.trim().toUpperCase() });
      onDiscountApplied({ amount: result.discount_amount!, codeId: result.discount_id!, code: code.trim().toUpperCase() });
      toast.success(t(`₹${result.discount_amount} discount applied!`, `₹${result.discount_amount} छूट लागू!`));
    }
    setChecking(false);
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    onDiscountApplied(null);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {applied.code} — {applied.percentage}% {t('off', 'छूट')} (₹{applied.amount})
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemove}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('Discount code', 'छूट कोड')}
          className="pl-9 font-mono tracking-wider"
        />
      </div>
      <Button variant="outline" onClick={handleApply} disabled={checking || !code.trim()}>
        {checking ? '...' : t('Apply', 'लागू करें')}
      </Button>
    </div>
  );
};

export default DiscountCodeInput;
