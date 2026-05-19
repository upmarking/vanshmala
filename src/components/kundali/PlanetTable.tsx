import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PlanetPosition } from '@/types/kundali';

interface Props { planets: PlanetPosition[]; }

const PLANET_EMOJI: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

export default function PlanetTable({ planets }: Props) {
  const { t } = useLanguage();
  if (!planets?.length) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-saffron/20 text-left">
            <th className="py-2 px-3 font-display text-saffron">{t('Planet', 'ग्रह')}</th>
            <th className="py-2 px-3">{t('Sign', 'राशि')}</th>
            <th className="py-2 px-3">{t('Degree', 'अंश')}</th>
            <th className="py-2 px-3">{t('Nakshatra', 'नक्षत्र')}</th>
            <th className="py-2 px-3">{t('Pada', 'पद')}</th>
            <th className="py-2 px-3">{t('House', 'भाव')}</th>
            <th className="py-2 px-3">{t('R', 'व')}</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((p) => (
            <tr key={p.name} className="border-b border-border/50 hover:bg-saffron/5 transition-colors">
              <td className="py-2 px-3 font-medium">
                <span className="mr-1.5">{PLANET_EMOJI[p.name] || '•'}</span>
                {p.name}
              </td>
              <td className="py-2 px-3">{p.sign}</td>
              <td className="py-2 px-3 font-mono text-xs">
                {p.degree?.toFixed(2)}°
              </td>
              <td className="py-2 px-3">{p.nakshatra}</td>
              <td className="py-2 px-3 text-center">{p.nakshatra_pada}</td>
              <td className="py-2 px-3 text-center">{p.house}</td>
              <td className="py-2 px-3 text-center">
                {p.retrograde && <span className="text-red-500 font-bold">R</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
