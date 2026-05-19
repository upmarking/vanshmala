import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useKundaliGate } from '@/hooks/useVanshMitra';
import VanshMitraGate from '@/components/vanshmitra/VanshMitraGate';
import VanshMitraVoice from '@/components/vanshmitra/VanshMitraVoice';
import SEO from '@/components/SEO';

export default function VanshMitra() {
  const { user } = useAuth();
  const { data: gateData, isLoading } = useKundaliGate(user?.id);

  return (
    <>
      <SEO
        title="VanshMitra — AI Vedic Astrologer | VanshMala"
        description="Speak with VanshMitra, your personal AI Vedic astrologer. Get chart-aware predictions, Dasha analysis, and spiritual guidance through live voice consultation."
      />

      <div className="container max-w-4xl mx-auto py-4 md:py-6 px-3 md:px-4">
        {isLoading ? (
          <div key="loading" className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-gold/20 via-saffron/15 to-gold-light/20 animate-glow blur-sm" />
                <Loader2 className="h-10 w-10 text-saffron animate-spin relative" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading VanshMitra…
              </p>
            </div>
          </div>
        ) : gateData?.hasKundali ? (
          <VanshMitraVoice key="voice" />
        ) : (
          <VanshMitraGate key="gate" />
        )}
      </div>
    </>
  );
}
