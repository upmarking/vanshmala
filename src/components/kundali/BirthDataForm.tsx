import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Globe, Sparkles, Loader2, LocateFixed, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAyanamsaOptions, useLocationSearch, useTimezone } from '@/hooks/useKundali';
import { useLanguage } from '@/contexts/LanguageContext';
import type { KundaliCalculateRequest, LocationSuggestion } from '@/types/kundali';
import { cn } from '@/lib/utils';

interface BirthDataFormProps {
  onSubmit: (data: KundaliCalculateRequest & { name: string; place_name: string }) => void;
  loading?: boolean;
  initialData?: Partial<KundaliCalculateRequest & { name: string; place_name: string }>;
}

const TIMEZONE_PRESETS = [
  { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'EST (UTC-5:00)', value: 'America/New_York' },
  { label: 'CST (UTC-6:00)', value: 'America/Chicago' },
  { label: 'PST (UTC-8:00)', value: 'America/Los_Angeles' },
  { label: 'GMT (UTC+0:00)', value: 'Europe/London' },
  { label: 'CET (UTC+1:00)', value: 'Europe/Berlin' },
  { label: 'JST (UTC+9:00)', value: 'Asia/Tokyo' },
  { label: 'AEST (UTC+10:00)', value: 'Australia/Sydney' },
  { label: 'SGT (UTC+8:00)', value: 'Asia/Singapore' },
  { label: 'NST (UTC+5:45)', value: 'Asia/Kathmandu' },
];

export default function BirthDataForm({ onSubmit, loading = false, initialData }: BirthDataFormProps) {
  const { t } = useLanguage();
  const { data: ayanamsaOptions, isLoading: loadingAyanamsa } = useAyanamsaOptions();

  const [name, setName] = useState(initialData?.name ?? '');
  const [birthDate, setBirthDate] = useState(initialData?.birth_date ?? '');
  const [birthTime, setBirthTime] = useState(initialData?.birth_time ?? '');
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() ?? '');
  const [timezone, setTimezone] = useState(initialData?.timezone ?? 'Asia/Kolkata');
  const [placeName, setPlaceName] = useState(initialData?.place_name ?? '');
  const [ayanamsa, setAyanamsa] = useState(initialData?.ayanamsa ?? 'lahiri');
  const [geoLoading, setGeoLoading] = useState(false);

  // Location search state
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data: suggestions, isLoading: isSearching } = useLocationSearch(debouncedQuery);
  const { mutateAsync: fetchTimezone } = useTimezone();

  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name || '');
      if (initialData.birth_date) setBirthDate(initialData.birth_date);
      if (initialData.birth_time) setBirthTime(initialData.birth_time);
      if (initialData.latitude) setLatitude(String(initialData.latitude));
      if (initialData.longitude) setLongitude(String(initialData.longitude));
      if (initialData.timezone) setTimezone(initialData.timezone);
      if (initialData.place_name) setPlaceName(initialData.place_name);
      if (initialData.ayanamsa) setAyanamsa(initialData.ayanamsa);
    }
  }, [initialData]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat.toFixed(4));
        setLongitude(lon.toFixed(4));
        setGeoLoading(false);
        setPlaceName(t('Current Location', 'वर्तमान स्थान'));
        
        try {
          const tzData = await fetchTimezone({ lat, lon });
          if (tzData?.timeZone) setTimezone(tzData.timeZone);
        } catch (e) {
          console.error('Failed to auto-detect timezone:', e);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleLocationSelect = async (loc: LocationSuggestion) => {
    const lat = parseFloat(loc.lat);
    const lon = parseFloat(loc.lon);
    setLatitude(lat.toFixed(4));
    setLongitude(lon.toFixed(4));
    setPlaceName(loc.display_name);
    setOpen(false);
    setSearchQuery('');

    try {
      const tzData = await fetchTimezone({ lat, lon });
      if (tzData?.timeZone) setTimezone(tzData.timeZone);
    } catch (e) {
      console.error('Failed to fetch timezone for location:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) return;
    onSubmit({
      name,
      birth_date: birthDate,
      birth_time: birthTime,
      latitude: lat,
      longitude: lon,
      timezone,
      place_name: placeName,
      ayanamsa,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-saffron/20 shadow-soft overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-saffron/10 via-gold/5 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Sparkles className="h-5 w-5 text-saffron" />
            {t('Birth Details', 'जन्म विवरण')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t(
              'Enter the birth date, time, and location for accurate Vedic calculations.',
              'सटीक वैदिक गणना के लिए जन्म तिथि, समय और स्थान दर्ज करें।'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="kundali-name" className="text-sm font-medium">
                {t('Name', 'नाम')}
              </Label>
              <Input
                id="kundali-name"
                placeholder={t('Full name', 'पूरा नाम')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Date + Time row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kundali-date" className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-saffron" />
                  {t('Birth Date', 'जन्म तिथि')}
                </Label>
                <Input
                  id="kundali-date"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kundali-time" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-saffron" />
                  {t('Birth Time', 'जन्म समय')}
                </Label>
                <Input
                  id="kundali-time"
                  type="time"
                  required
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                />
              </div>
            </div>

            {/* Place + Geolocation */}
            <div className="space-y-1.5">
              <Label htmlFor="kundali-place" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-saffron" />
                {t('Birth Place', 'जन्म स्थान')}
              </Label>
              <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative flex-1 group">
                      <Input
                        id="kundali-place"
                        placeholder={t('e.g. New Delhi, India', 'उदा. नई दिल्ली, भारत')}
                        value={placeName || searchQuery}
                        onChange={(e) => {
                          setPlaceName('');
                          setSearchQuery(e.target.value);
                          if (!open) setOpen(true);
                        }}
                        className={cn(
                          "w-full pr-10 transition-all duration-200 border-saffron/20 focus:border-saffron focus:ring-saffron/20",
                          placeName && "font-medium text-saffron"
                        )}
                        autoComplete="off"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-saffron transition-colors" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="p-0 w-[var(--radix-popover-trigger-width)]" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >

                    <Command shouldFilter={false}>
                      <CommandList>
                        {isSearching && (
                          <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-saffron" />
                            {t('Searching...', 'खोज रहे हैं...')}
                          </div>
                        )}
                        {!isSearching && suggestions && suggestions.length > 0 && (
                          <CommandGroup heading={t('Suggested Locations', 'सुझाए गए स्थान')}>
                            {suggestions.map((loc: LocationSuggestion) => (
                              <CommandItem
                                key={loc.place_id}
                                value={loc.display_name}
                                onSelect={() => handleLocationSelect(loc)}
                                className="cursor-pointer hover:bg-saffron/5 aria-selected:bg-saffron/10 flex flex-col items-start py-2.5 px-4"
                              >
                                <div className="font-medium text-sm line-clamp-1">{loc.display_name.split(',')[0]}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{loc.display_name}</div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {!isSearching && debouncedQuery.length >= 2 && (!suggestions || suggestions.length === 0) && (
                          <CommandEmpty>{t('No locations found.', 'कोई स्थान नहीं मिला।')}</CommandEmpty>
                        )}
                        {debouncedQuery.length < 2 && !isSearching && (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            {t('Type at least 2 characters...', 'कम से कम 2 अक्षर टाइप करें...')}
                          </div>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  className="shrink-0 border-saffron/30 hover:bg-saffron/10 hover:text-saffron hover:border-saffron transition-all duration-200"
                  title={t('Use my location', 'मेरा स्थान उपयोग करें')}
                >
                  {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Lat + Long */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kundali-lat" className="text-xs text-muted-foreground">
                  {t('Latitude', 'अक्षांश')}
                </Label>
                <Input
                  id="kundali-lat"
                  type="number"
                  step="0.0001"
                  required
                  placeholder="28.6139"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kundali-lon" className="text-xs text-muted-foreground">
                  {t('Longitude', 'देशांतर')}
                </Label>
                <Input
                  id="kundali-lon"
                  type="number"
                  step="0.0001"
                  required
                  placeholder="77.2090"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>

            {/* Timezone + Ayanamsa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-saffron" />
                  {t('Timezone', 'समय क्षेत्र')}
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="kundali-tz">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_PRESETS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('Ayanamsa', 'अयनांश')}
                </Label>
                <Select value={ayanamsa} onValueChange={setAyanamsa} disabled={loadingAyanamsa}>
                  <SelectTrigger id="kundali-ayanamsa">
                    <SelectValue placeholder={loadingAyanamsa ? 'Loading…' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(ayanamsaOptions ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !birthDate || !birthTime || !latitude || !longitude}
              className="w-full bg-gradient-saffron hover:opacity-90 text-white font-semibold h-11 text-base transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('Calculating…', 'गणना हो रही है…')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('Generate Kundali', 'कुंडली बनाएं')}
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
