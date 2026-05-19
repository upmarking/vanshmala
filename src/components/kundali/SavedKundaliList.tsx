import { motion } from 'framer-motion';
import { Trash2, Eye, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedKundalis, useDeleteKundali } from '@/hooks/useKundali';
import type { KundaliInputRow } from '@/types/kundali';

interface Props {
  onSelect: (input: KundaliInputRow) => void;
}

export default function SavedKundaliList({ onSelect }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: kundalis, isLoading } = useSavedKundalis(user?.id);
  const deleteMutation = useDeleteKundali();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-saffron" />
      </div>
    );
  }

  if (!kundalis?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {t('No saved kundalis yet.', 'अभी तक कोई कुंडली सहेजी नहीं गई है।')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm text-saffron mb-2">
        {t('Saved Kundalis', 'सहेजी गई कुंडलियाँ')} ({kundalis.length})
      </h3>
      {kundalis.map((k, i) => (
        <motion.div
          key={k.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card className="hover:shadow-md transition-shadow border-border/50">
            <CardContent className="py-2.5 px-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{k.name || t('Untitled', 'बिना नाम')}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="h-3 w-3" /> {k.birth_date}
                  {k.place_name && (
                    <>
                      <MapPin className="h-3 w-3 ml-1" />
                      <span className="truncate max-w-[120px]">{k.place_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-saffron hover:bg-saffron/10"
                  onClick={() => onSelect(k)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (!user) return;
                    deleteMutation.mutate({ id: k.id, userId: user.id });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
