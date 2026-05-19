import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, MapPin, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCalculateKundali, useCalculatePanchang, useSaveKundali, useSavedKundalis, useSavedKundaliResults } from '@/hooks/useKundali';
import { useEffect } from 'react';
import BirthDataForm from '@/components/kundali/BirthDataForm';
import KundaliChart from '@/components/kundali/KundaliChart';
import SouthIndianChart from '@/components/kundali/SouthIndianChart';
import PlanetTable from '@/components/kundali/PlanetTable';
import DivisionalCharts from '@/components/kundali/DivisionalCharts';
import DashaTimeline from '@/components/kundali/DashaTimeline';
import AshtakavargaGrid from '@/components/kundali/AshtakavargaGrid';
import PanchangCard from '@/components/kundali/PanchangCard';
import MuhurtaScanner from '@/components/kundali/MuhurtaScanner';
import KundliMatching from '@/components/kundali/KundliMatching';
import SEO from '@/components/SEO';
import type { KundaliResult, PanchangResult, KundaliCalculateRequest, KundaliInputRow } from '@/types/kundali';

type ChartStyle = 'north' | 'south';

export default function Kundali() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const calcMutation = useCalculateKundali();
  const panchangMutation = useCalculatePanchang();
  const saveMutation = useSaveKundali();

  const [activeTab, setActiveTab] = useState('kundali');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');
  const [kundaliResult, setKundaliResult] = useState<KundaliResult | null>(null);
  const [panchangResult, setPanchangResult] = useState<PanchangResult | null>(null);
  const [lastInput, setLastInput] = useState<(KundaliCalculateRequest & { name: string; place_name: string }) | null>(null);

  // Panchang form
  const [pLat, setPLat] = useState('28.6139');
  const [pLon, setPLon] = useState('77.2090');
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [pTz, setPTz] = useState('Asia/Kolkata');

  // Load saved kundali on mount
  const { data: savedList, isLoading: loadingSaved } = useSavedKundalis(user?.id);
  const mainSaved = savedList?.[0];
  const { data: savedResults } = useSavedKundaliResults(mainSaved?.id);

  useEffect(() => {
    if (mainSaved && !lastInput) {
      setLastInput({
        name: mainSaved.name,
        birth_date: mainSaved.birth_date,
        birth_time: mainSaved.birth_time,
        latitude: mainSaved.latitude,
        longitude: mainSaved.longitude,
        timezone: mainSaved.timezone || undefined,
        place_name: mainSaved.place_name || '',
        ayanamsa: mainSaved.ayanamsa,
      });
    }
  }, [mainSaved, lastInput]);

  useEffect(() => {
    const kundaliRes = savedResults?.find(r => r.calc_type === 'kundali');
    if (kundaliRes && !kundaliResult) {
      setKundaliResult(kundaliRes.result_data);
    }
  }, [savedResults, kundaliResult]);

  const handleKundaliSubmit = async (data: KundaliCalculateRequest & { name: string; place_name: string }) => {
    setLastInput(data);
    try {
      const result = await calcMutation.mutateAsync(data);
      setKundaliResult(result);
    } catch (err) {
      toast.error((err as Error).message || 'Calculation failed');
    }
  };

  const handleSave = async () => {
    if (!user || !lastInput || !kundaliResult) return;
    try {
      await saveMutation.mutateAsync({
        userId: user.id,
        input: {
          name: lastInput.name || '',
          birth_date: lastInput.birth_date,
          birth_time: lastInput.birth_time,
          latitude: lastInput.latitude,
          longitude: lastInput.longitude,
          timezone: lastInput.timezone || null,
          place_name: lastInput.place_name || null,
          ayanamsa: lastInput.ayanamsa || 'lahiri',
          language: language,
        },
        result: kundaliResult,
        calcType: 'kundali',
      });
      toast.success(t('Kundali saved!', 'कुंडली सहेजी गई!'));
    } catch (err) {
      toast.error((err as Error).message || 'Save failed');
    }
  };

  const handlePanchangFetch = async () => {
    try {
      const result = await panchangMutation.mutateAsync({
        latitude: parseFloat(pLat),
        longitude: parseFloat(pLon),
        date: pDate,
        timezone: pTz,
      });
      setPanchangResult(result);
    } catch (err) {
      toast.error((err as Error).message || 'Panchang fetch failed');
    }
  };


  const ascSignId = kundaliResult?.ascendant?.sign_id || (kundaliResult?.planets?.[0]?.sign_id) || 1;

  return (
    <>
      <SEO
        title="Vedic Kundali — VanshMala"
        description="Generate accurate Vedic birth charts, daily Panchang, and find auspicious Muhurtas."
      />

      <div className="animate-fade-in-up container max-w-6xl mx-auto py-4 md:py-8 px-3 md:px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            <span className="text-gradient-saffron">🪷 {t('Vedic Kundali', 'वैदिक कुंडली')}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-2xl">
            {t(
              'Generate birth charts, check daily Panchang, and find auspicious Muhurtas — powered by Swiss Ephemeris.',
              'जन्म कुंडली बनाएं, दैनिक पंचांग देखें, और शुभ मुहूर्त खोजें — स्विस एफेमेरिस द्वारा संचालित।'
            )}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 h-11">
                <TabsTrigger value="kundali" className="text-xs sm:text-sm data-[state=active]:bg-saffron/20 data-[state=active]:text-saffron">
                  🪷 {t('Chart', 'कुंडली')}
                </TabsTrigger>
                <TabsTrigger value="panchang" className="text-xs sm:text-sm data-[state=active]:bg-saffron/20 data-[state=active]:text-saffron">
                  📅 {t('Panchang', 'पंचांग')}
                </TabsTrigger>
                <TabsTrigger value="muhurta" className="text-xs sm:text-sm data-[state=active]:bg-saffron/20 data-[state=active]:text-saffron">
                  🕐 {t('Muhurta', 'मुहूर्त')}
                </TabsTrigger>
                <TabsTrigger value="matching" className="text-xs sm:text-sm data-[state=active]:bg-lotus/20 data-[state=active]:text-lotus">
                  💑 {t('Match', 'मिलान')}
                </TabsTrigger>
              </TabsList>

              {/* ── Birth Chart Tab ── */}
              <TabsContent value="kundali" className="mt-4 space-y-6">
                <BirthDataForm
                  onSubmit={handleKundaliSubmit}
                  loading={calcMutation.isPending}
                  initialData={lastInput || undefined}
                />

                {calcMutation.isError && (
                  <div className="text-red-500 text-sm text-center">
                    {(calcMutation.error as Error).message}
                  </div>
                )}

                {kundaliResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Save + Chart Style Toggle */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm" variant={chartStyle === 'north' ? 'default' : 'outline'}
                          onClick={() => setChartStyle('north')}
                          className={chartStyle === 'north' ? 'bg-saffron text-white' : ''}
                        >
                          {t('North Indian', 'उत्तर भारतीय')}
                        </Button>
                        <Button
                          size="sm" variant={chartStyle === 'south' ? 'default' : 'outline'}
                          onClick={() => setChartStyle('south')}
                          className={chartStyle === 'south' ? 'bg-saffron text-white' : ''}
                        >
                          {t('South Indian', 'दक्षिण भारतीय')}
                        </Button>
                      </div>
                      {user && (
                        <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMutation.isPending}
                          className="border-gold/30 hover:bg-gold/10 text-gold-dark">
                          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                          {t('Save to Profile', 'प्रोफ़ाइल में सहेजें')}
                        </Button>
                      )}
                    </div>

                    {/* Chart */}
                    <Card className="border-saffron/15 overflow-hidden">
                      <CardContent className="p-4">
                        {chartStyle === 'north' ? (
                          <KundaliChart planets={kundaliResult.planets || []} ascendantSignId={ascSignId} />
                        ) : (
                          <SouthIndianChart planets={kundaliResult.planets || []} ascendantSignId={ascSignId} />
                        )}
                      </CardContent>
                    </Card>

                    {/* Planet Table */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-display">{t('Planetary Positions', 'ग्रह स्थिति')}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <PlanetTable planets={kundaliResult.planets || []} />
                      </CardContent>
                    </Card>

                    {/* Divisional Charts */}
                    {kundaliResult.vargas && kundaliResult.vargas.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-display">{t('Divisional Charts (Vargas)', 'विभागीय चार्ट')}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <DivisionalCharts vargas={kundaliResult.vargas} />
                        </CardContent>
                      </Card>
                    )}

                    {/* Dasha */}
                    {kundaliResult.dasha && kundaliResult.dasha.length > 0 && (
                      <Card className="border-border/50">
                        <CardContent className="pt-4">
                          <DashaTimeline dashas={kundaliResult.dasha} />
                        </CardContent>
                      </Card>
                    )}

                    {/* Ashtakavarga */}
                    {kundaliResult.ashtakavarga && (
                      <Card className="border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-display">{t('Ashtakavarga', 'अष्टकवर्ग')}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <AshtakavargaGrid
                            bhinnashtakavarga={kundaliResult.ashtakavarga.bhinnashtakavarga}
                            sarvashtakavarga={kundaliResult.ashtakavarga.sarvashtakavarga}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </TabsContent>

              {/* ── Panchang Tab ── */}
              <TabsContent value="panchang" className="mt-4 space-y-4">
                <Card className="border-saffron/20 shadow-soft">
                  <CardHeader className="bg-gradient-to-r from-saffron/10 to-transparent pb-3">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-saffron" />
                      {t('Daily Panchang', 'दैनिक पंचांग')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Date', 'तिथि')}</Label>
                        <Input type="date" value={pDate} onChange={e => setPDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Latitude', 'अक्षांश')}</Label>
                        <Input type="number" step="0.0001" value={pLat} onChange={e => setPLat(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Longitude', 'देशांतर')}</Label>
                        <Input type="number" step="0.0001" value={pLon} onChange={e => setPLon(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Timezone', 'TZ')}</Label>
                        <Input value={pTz} onChange={e => setPTz(e.target.value)} />
                      </div>
                    </div>
                    <Button
                      onClick={handlePanchangFetch}
                      disabled={panchangMutation.isPending}
                      className="w-full bg-gradient-saffron hover:opacity-90 text-white font-semibold"
                    >
                      {panchangMutation.isPending ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t('Loading…', 'लोड हो रहा है…')}</span>
                      ) : (
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{t('Get Panchang', 'पंचांग प्राप्त करें')}</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {panchangMutation.isError && (
                  <div className="text-red-500 text-sm text-center">{(panchangMutation.error as Error).message}</div>
                )}

                {panchangResult && <PanchangCard data={panchangResult} />}
              </TabsContent>

              {/* ── Muhurta Tab ── */}
              <TabsContent value="muhurta" className="mt-4">
                <MuhurtaScanner />
              </TabsContent>

              {/* ── Matching Tab ── */}
              <TabsContent value="matching" className="mt-4">
                <KundliMatching />
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </div>
    </>
  );
}
