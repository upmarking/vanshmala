import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { DashaPeriod } from '@/types/kundali';

interface Props { dashas: DashaPeriod[]; }

const PLANET_COLORS: Record<string, string> = {
  Sun: 'bg-orange-600', Moon: 'bg-blue-500', Mars: 'bg-red-600',
  Mercury: 'bg-green-600', Jupiter: 'bg-yellow-500', Venus: 'bg-pink-500',
  Saturn: 'bg-slate-600', Rahu: 'bg-purple-700', Ketu: 'bg-amber-800',
};

function formatDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export default function DashaTimeline({ dashas }: Props) {
  const { t } = useLanguage();
  if (!dashas?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      {t('No Dasha data available.', 'दशा डेटा उपलब्ध नहीं है।')}
    </div>
  );

  const now = new Date();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      <h3 className="font-display text-base text-saffron mb-3">
        {t('Vimshottari Mahadasha', 'विंशोत्तरी महादशा')}
      </h3>
      <div className="space-y-1.5">
        {dashas.map((d, i) => {
          const start = new Date(d.start);
          const end = new Date(d.end);
          const isCurrent = now >= start && now <= end;
          const isPast = now > end;
          const colorClass = PLANET_COLORS[d.planet] || 'bg-gray-500';

          return (
            <motion.div
              key={`${d.planet}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isCurrent ? 'bg-saffron/15 border border-saffron/30 ring-1 ring-saffron/20' :
                isPast ? 'opacity-50' : 'hover:bg-muted/30'
              }`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${colorClass}`} />
              <div className="font-medium w-16">{d.planet}</div>
              <div className="flex-1 text-xs text-muted-foreground">
                {formatDate(d.start)} — {formatDate(d.end)}
              </div>
              {d.duration_years && (
                <div className="text-xs text-muted-foreground">{d.duration_years}y</div>
              )}
              {isCurrent && (
                <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded-full">
                  {t('ACTIVE', 'चालू')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
