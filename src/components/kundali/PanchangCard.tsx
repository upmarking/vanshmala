import { motion } from 'framer-motion';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PanchangResult } from '@/types/kundali';

interface Props { data: PanchangResult; }

function val(v: unknown): string {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    // Try common property names from the API
    return (
      o.english || 
      o.name || 
      o.value || 
      o.label || 
      o.tithi || 
      o.nakshatra || 
      o.yoga || 
      o.karana || 
      (o.sanskrit ? String(o.sanskrit) : JSON.stringify(v))
    ) as string;
  }
  return String(v);
}

function timeVal(v: unknown): string {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    if (o.start && o.end) return `${o.start} – ${o.end}`;
    if (o.time) return String(o.time);
    return JSON.stringify(v);
  }
  return String(v);
}


export default function PanchangCard({ data: rawData }: Props) {
  const { t } = useLanguage();

  // Handle potentially nested response
  const data = (rawData as any).panchang || rawData;

  const elements = [
    { label: t('Tithi', 'तिथि'), value: val(data.tithi || (data as any).tithi_details), icon: '🌙' },
    { label: t('Nakshatra', 'नक्षत्र'), value: val(data.nakshatra || (data as any).nakshatra_details), icon: '⭐' },
    { label: t('Yoga', 'योग'), value: val(data.yoga || (data as any).yoga_details), icon: '🕉️' },
    { label: t('Karana', 'करण'), value: val(data.karana || (data as any).karana_details), icon: '📐' },
    { label: t('Vara', 'वार'), value: val(data.vara || (data as any).vaara || (data as any).day), icon: '📅' },
  ];

  const timings = [
    { label: t('Sunrise', 'सूर्योदय'), value: data.sunrise || data.sun_rise || data.sunRise || (data as any).sun?.rise, icon: <Sunrise className="h-4 w-4 text-orange-400" /> },
    { label: t('Sunset', 'सूर्यास्त'), value: data.sunset || data.sun_set || data.sunSet || (data as any).sun?.set, icon: <Sunset className="h-4 w-4 text-purple-400" /> },
    { label: t('Moonrise', 'चंद्रोदय'), value: data.moonrise || data.moon_rise || data.moonRise || (data as any).moon?.rise, icon: <Moon className="h-4 w-4 text-blue-300" /> },
    { label: t('Rahu Kala', 'राहु काल'), value: timeVal(data.rahu_kala || data.rahu_kaal || data.rahuKaal || (data as any).rahukaal), icon: <Sun className="h-4 w-4 text-red-400" /> },
    { label: t('Gulika Kala', 'गुलिक काल'), value: timeVal(data.gulika_kala || data.gulika_kaal || data.gulikaKaal || (data as any).gulikakaal) },
    { label: t('Abhijit Muhurta', 'अभिजित मुहूर्त'), value: timeVal(data.abhijit_muhurta || data.abhijit_muhurat || data.abhijit || (data as any).abhijit_muhurat) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Five Elements */}
      <Card className="border-saffron/20 shadow-soft">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-transparent pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            🕉️ {t('Panchang Elements', 'पंचांग तत्व')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {elements.map(el => (
              <div key={el.label} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-saffron/5 transition-colors">
                <span className="text-lg mt-0.5">{el.icon}</span>
                <div>
                  <div className="text-xs text-muted-foreground">{el.label}</div>
                  <div className="text-sm font-medium">{el.value}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timings */}
      <Card className="border-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            ⏰ {t('Timings', 'समय')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {timings.filter(t => t.value).map(tm => (
              <div key={tm.label} className="p-2 rounded-lg bg-muted/20 text-center">
                <div className="flex justify-center mb-1">{tm.icon}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tm.label}</div>
                <div className="text-xs font-medium mt-0.5">{String(tm.value || '—')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
