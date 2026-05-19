import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VargaChart } from '@/types/kundali';

interface Props { vargas: VargaChart[]; }

const SIGN_ABBR = ['','Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];

export default function DivisionalCharts({ vargas }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState(vargas?.[0]?.name || '');

  if (!vargas?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      {t('No divisional chart data available.', 'विभागीय चार्ट डेटा उपलब्ध नहीं है।')}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          {vargas.map(v => (
            <TabsTrigger key={v.name} value={v.name} className="text-xs px-2 py-1 data-[state=active]:bg-saffron/20 data-[state=active]:text-saffron">
              {v.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {vargas.map(v => (
          <TabsContent key={v.name} value={v.name} className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">{v.name} (D{v.divisor})</div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-saffron/20">
                  <th className="py-1.5 px-2 text-left text-saffron font-display">{t('Planet','ग्रह')}</th>
                  <th className="py-1.5 px-2 text-left">{t('Sign','राशि')}</th>
                </tr>
              </thead>
              <tbody>
                {v.planets.map(p => (
                  <tr key={p.name} className="border-b border-border/30 hover:bg-saffron/5">
                    <td className="py-1.5 px-2 font-medium">{p.name}</td>
                    <td className="py-1.5 px-2">{p.sign || SIGN_ABBR[p.sign_id] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
