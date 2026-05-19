import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  bhinnashtakavarga?: Array<{ planet: string; points: number[]; total: number }>;
  sarvashtakavarga?: number[];
}

const SIGNS = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];

export default function AshtakavargaGrid({ bhinnashtakavarga, sarvashtakavarga }: Props) {
  const { t } = useLanguage();

  if (!bhinnashtakavarga?.length && !sarvashtakavarga?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      {t('No Ashtakavarga data available.', 'अष्टकवर्ग डेटा उपलब्ध नहीं है।')}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {bhinnashtakavarga && bhinnashtakavarga.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="font-display text-sm text-saffron mb-2">{t('Bhinnashtakavarga','भिन्नाष्टकवर्ग')}</h4>
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-saffron/20">
                <th className="py-1.5 px-2 text-left font-display text-saffron">{t('Planet','ग्रह')}</th>
                {SIGNS.map(s => <th key={s} className="py-1.5 px-1 text-center">{s}</th>)}
                <th className="py-1.5 px-2 text-center text-gold font-bold">{t('Total','कुल')}</th>
              </tr>
            </thead>
            <tbody>
              {bhinnashtakavarga.map(row => (
                <tr key={row.planet} className="border-b border-border/30 hover:bg-saffron/5">
                  <td className="py-1.5 px-2 font-medium">{row.planet}</td>
                  {(row.points || []).map((pt, i) => (
                    <td key={i} className={`py-1.5 px-1 text-center font-mono ${pt >= 4 ? 'text-green-500' : pt <= 2 ? 'text-red-400' : ''}`}>
                      {pt}
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-center font-bold text-gold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sarvashtakavarga && sarvashtakavarga.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="font-display text-sm text-saffron mb-2">{t('Sarvashtakavarga','सर्वाष्टकवर्ग')}</h4>
          <div className="flex gap-1">
            {sarvashtakavarga.map((val, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="text-[10px] text-muted-foreground">{SIGNS[i]}</div>
                <div className={`text-sm font-bold py-1 rounded ${val >= 28 ? 'text-green-500 bg-green-500/10' : val <= 22 ? 'text-red-400 bg-red-400/10' : ''}`}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
