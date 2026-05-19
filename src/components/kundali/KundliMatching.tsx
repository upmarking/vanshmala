import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, MapPin, Loader2, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PersonData {
  name: string;
  birth_date: string;
  birth_time: string;
  latitude: string;
  longitude: string;
  place_name: string;
}

interface GunaScore {
  name: string;
  obtained: number;
  maximum: number;
  description: string;
}

interface MatchResult {
  total_score: number;
  max_score: number;
  percentage: number;
  gunas: GunaScore[];
  recommendation: string;
}

const GUNA_INFO: Record<string, { emoji: string; descEn: string; descHi: string }> = {
  Varna: { emoji: '🎭', descEn: 'Spiritual compatibility', descHi: 'आध्यात्मिक अनुकूलता' },
  Vashya: { emoji: '🤝', descEn: 'Mutual attraction', descHi: 'पारस्परिक आकर्षण' },
  Tara: { emoji: '⭐', descEn: 'Destiny & luck', descHi: 'भाग्य और सौभाग्य' },
  Yoni: { emoji: '🦁', descEn: 'Physical compatibility', descHi: 'शारीरिक अनुकूलता' },
  Graha: { emoji: '☀️', descEn: 'Planetary friendship', descHi: 'ग्रह मैत्री' },
  Gana: { emoji: '🌿', descEn: 'Temperament match', descHi: 'स्वभाव अनुकूलता' },
  Bhakoot: { emoji: '💫', descEn: 'Love & family', descHi: 'प्रेम और परिवार' },
  Nadi: { emoji: '🧬', descEn: 'Health & genes', descHi: 'स्वास्थ्य और वंश' },
};

const emptyPerson = (): PersonData => ({
  name: '',
  birth_date: '',
  birth_time: '',
  latitude: '',
  longitude: '',
  place_name: '',
});

export default function KundliMatching() {
  const { t } = useLanguage();
  const [personA, setPersonA] = useState<PersonData>(emptyPerson());
  const [personB, setPersonB] = useState<PersonData>(emptyPerson());
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const updateA = (field: keyof PersonData, value: string) =>
    setPersonA((prev) => ({ ...prev, [field]: value }));
  const updateB = (field: keyof PersonData, value: string) =>
    setPersonB((prev) => ({ ...prev, [field]: value }));

  const handleMatch = async () => {
    if (!personA.birth_date || !personA.birth_time || !personB.birth_date || !personB.birth_time) {
      toast.error(t('Please fill birth date and time for both', 'कृपया दोनों के लिए जन्म तिथि और समय भरें'));
      return;
    }

    setLoading(true);
    try {
      // Simulate matching calculation using the Ashtakoot system
      // In production this would call the VedicPanchanga matching API
      const gunas: GunaScore[] = [
        { name: 'Varna', obtained: Math.floor(Math.random() * 2), maximum: 1, description: '' },
        { name: 'Vashya', obtained: Math.floor(Math.random() * 3), maximum: 2, description: '' },
        { name: 'Tara', obtained: Math.floor(Math.random() * 4), maximum: 3, description: '' },
        { name: 'Yoni', obtained: Math.floor(Math.random() * 5), maximum: 4, description: '' },
        { name: 'Graha', obtained: Math.floor(Math.random() * 6), maximum: 5, description: '' },
        { name: 'Gana', obtained: Math.floor(Math.random() * 7), maximum: 6, description: '' },
        { name: 'Bhakoot', obtained: Math.floor(Math.random() * 8), maximum: 7, description: '' },
        { name: 'Nadi', obtained: Math.floor(Math.random() * 9), maximum: 8, description: '' },
      ];

      const total = gunas.reduce((s, g) => s + g.obtained, 0);
      const max = gunas.reduce((s, g) => s + g.maximum, 0);
      const pct = Math.round((total / max) * 100);

      let recommendation = '';
      if (pct >= 75) recommendation = t('Excellent match! Highly recommended.', 'उत्तम मिलान! अत्यधिक अनुशंसित।');
      else if (pct >= 50) recommendation = t('Good compatibility. A harmonious union is possible.', 'अच्छी अनुकूलता। सामंजस्यपूर्ण संबंध संभव है।');
      else if (pct >= 25) recommendation = t('Average compatibility. Remedies recommended.', 'औसत अनुकूलता। उपाय अनुशंसित हैं।');
      else recommendation = t('Low compatibility. Consult an astrologer for remedies.', 'कम अनुकूलता। उपायों के लिए ज्योतिषी से परामर्श करें।');

      setResult({ total_score: total, max_score: max, percentage: pct, gunas, recommendation });
    } catch (err) {
      toast.error((err as Error).message || t('Matching failed', 'मिलान विफल'));
    } finally {
      setLoading(false);
    }
  };

  // ── Person form ─────────────────────────────────────────
  const PersonForm = ({
    label,
    emoji,
    data,
    update,
  }: {
    label: string;
    emoji: string;
    data: PersonData;
    update: (field: keyof PersonData, value: string) => void;
  }) => (
    <Card className="border-saffron/15 shadow-soft">
      <CardHeader className="pb-3 bg-gradient-to-r from-saffron/8 to-transparent">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <span className="text-lg">{emoji}</span> {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('Name', 'नाम')}</Label>
          <Input
            placeholder={t('Full name', 'पूरा नाम')}
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3 text-saffron" />
              {t('Birth Date', 'जन्म तिथि')}
            </Label>
            <Input
              type="date"
              required
              value={data.birth_date}
              onChange={(e) => update('birth_date', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3 text-saffron" />
              {t('Birth Time', 'जन्म समय')}
            </Label>
            <Input
              type="time"
              required
              value={data.birth_time}
              onChange={(e) => update('birth_time', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3 text-saffron" />
            {t('Birth Place', 'जन्म स्थान')}
          </Label>
          <Input
            placeholder={t('e.g. Mumbai', 'उदा. मुंबई')}
            value={data.place_name}
            onChange={(e) => update('place_name', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  // ── Score color ─────────────────────────────────────────
  const getScoreColor = (pct: number) => {
    if (pct >= 75) return 'text-green-600 dark:text-green-400';
    if (pct >= 50) return 'text-saffron';
    if (pct >= 25) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Input forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonForm
          label={t('Person A (Var)', 'व्यक्ति अ (वर)')}
          emoji="🤵"
          data={personA}
          update={updateA}
        />
        <PersonForm
          label={t('Person B (Vadhu)', 'व्यक्ति ब (वधू)')}
          emoji="👰"
          data={personB}
          update={updateB}
        />
      </div>

      {/* Match button */}
      <Button
        onClick={handleMatch}
        disabled={loading}
        className="w-full bg-gradient-to-r from-lotus to-saffron hover:opacity-90 text-white font-semibold h-12 text-base shadow-saffron"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Analyzing Compatibility…', 'अनुकूलता विश्लेषण हो रहा है…')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {t('Check Compatibility', 'अनुकूलता जांचें')}
          </span>
        )}
      </Button>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Overall score */}
          <Card className="border-gold/20 shadow-gold overflow-hidden">
            <CardContent className="pt-6 pb-4 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-28 h-28 rounded-full border-4 border-gold/30 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40">
                  <div className="text-center">
                    <span className={`text-3xl font-bold font-display ${getScoreColor(result.percentage)}`}>
                      {result.percentage}%
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {result.total_score}/{result.max_score} {t('Gunas', 'गुण')}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/80 max-w-sm mx-auto">
                {result.recommendation}
              </p>
            </CardContent>
          </Card>

          {/* Guna details */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-saffron" />
                {t('Ashtakoot Guna Scores', 'अष्टकूट गुण अंक')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Detailed breakdown of 8 compatibility factors', '8 अनुकूलता कारकों का विस्तृत विवरण')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.gunas.map((guna) => {
                const info = GUNA_INFO[guna.name] || { emoji: '📊', descEn: '', descHi: '' };
                const pct = guna.maximum > 0 ? (guna.obtained / guna.maximum) * 100 : 0;
                return (
                  <div key={guna.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{info.emoji}</span>
                        <span className="font-medium">{guna.name}</span>
                        <span className="text-xs text-muted-foreground">
                          — {t(info.descEn, info.descHi)}
                        </span>
                      </span>
                      <span className="font-bold text-sm tabular-nums">
                        {guna.obtained}/{guna.maximum}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
