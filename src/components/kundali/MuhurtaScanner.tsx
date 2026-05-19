import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMuhurtaPurposes, useFindMuhurta } from '@/hooks/useKundali';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MuhurtaDay } from '@/types/kundali';

export default function MuhurtaScanner() {
  const { t } = useLanguage();
  const { data: purposes, isLoading: loadingPurposes } = useMuhurtaPurposes();
  const muhurtaMutation = useFindMuhurta();

  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lon, setLon] = useState('77.2090');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const handleSearch = () => {
    if (!purpose || !startDate || !endDate) return;
    muhurtaMutation.mutate({
      purpose,
      start_date: startDate,
      end_date: endDate,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      timezone,
    });
  };

  const rawData = muhurtaMutation.data as any;
  const results = (
    rawData?.results || 
    rawData?.muhurtas || 
    rawData?.data || 
    (Array.isArray(rawData) ? rawData : [])
  ) as MuhurtaDay[];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Search Form */}
      <Card className="border-saffron/20 shadow-soft">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-transparent pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Search className="h-4 w-4 text-saffron" />
            {t('Find Auspicious Muhurta', 'शुभ मुहूर्त खोजें')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-4">
          {/* Purpose */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('Purpose', 'उद्देश्य')}</Label>
            <Select value={purpose} onValueChange={setPurpose} disabled={loadingPurposes}>
              <SelectTrigger><SelectValue placeholder={t('Select purpose', 'उद्देश्य चुनें')} /></SelectTrigger>
              <SelectContent>
                {(purposes || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Start Date', 'आरंभ तिथि')}</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('End Date', 'अंत तिथि')}</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Latitude', 'अक्षांश')}</Label>
              <Input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Longitude', 'देशांतर')}</Label>
              <Input type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Timezone', 'समय क्षेत्र')}</Label>
              <Input value={timezone} onChange={e => setTimezone(e.target.value)} />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={muhurtaMutation.isPending || !purpose || !startDate || !endDate}
            className="w-full bg-gradient-saffron hover:opacity-90 text-white font-semibold"
          >
            {muhurtaMutation.isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t('Scanning…', 'स्कैन हो रहा है…')}</span>
            ) : (
              <span className="flex items-center gap-2"><Search className="h-4 w-4" />{t('Scan for Muhurta', 'मुहूर्त खोजें')}</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {muhurtaMutation.isError && (
        <div className="text-red-500 text-sm text-center">{(muhurtaMutation.error as Error).message}</div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-base text-saffron">
            {t('Results', 'परिणाम')} ({results.length})
          </h3>
          {results.map((day, i) => (
            <motion.div
              key={`${day.date}-${i}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${day.score >= 80 ? 'border-green-500/30' : day.score >= 60 ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{(day as any).date || (day as any).day || (day as any).formatted_date}</div>
                    <div className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${
                      day.score >= 80 ? 'bg-green-500/10 text-green-500' :
                      day.score >= 60 ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      <Star className="h-3 w-3" /> {day.score || (day as any).percentage || 0}/100
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                    {day.tithi && <span>Tithi: {day.tithi}</span>}
                    {day.nakshatra && <span>• {day.nakshatra}</span>}
                    {day.vara && <span>• {day.vara}</span>}
                  </div>
                  {((day.reasons && day.reasons.length > 0) || (day as any).pros) && (
                    <div className="space-y-0.5">
                      {(day.reasons || (day as any).pros || []).map((r: any, ri: number) => (
                        <div key={ri} className="flex items-start gap-1.5 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" /> {String(r)}
                        </div>
                      ))}
                    </div>
                  )}
                  {((day.cautions && day.cautions.length > 0) || (day as any).cons) && (
                    <div className="space-y-0.5 mt-1">
                      {(day.cautions || (day as any).cons || []).map((c: any, ci: number) => (
                        <div key={ci} className="flex items-start gap-1.5 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {String(c)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
