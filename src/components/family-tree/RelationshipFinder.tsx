import { useState, useMemo } from 'react';
import { Route, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';
import { calculateKinship } from '@/utils/kinshipUtils';

type Member = Database['public']['Tables']['family_members']['Row'];
type Relationship = Database['public']['Tables']['family_relationships']['Row'];

interface RelationshipFinderProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  relationships: Relationship[];
}

const MemberPicker = ({ members, value, onChange, label }: {
  members: Member[];
  value: Member | null;
  onChange: (m: Member) => void;
  label: string;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query || query.length < 1) return members.slice(0, 6);
    const q = query.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.full_name_hi?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, members]);

  return (
    <div className="relative">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-accent/50">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
            {value.avatar_url ? (
              <img src={value.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">{value.full_name[0]}</span>
            )}
          </div>
          <span className="text-sm font-medium truncate flex-1">{value.full_name}</span>
          <button onClick={() => { onChange(null as any); setQuery(''); }} className="p-0.5 hover:bg-muted rounded-full">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <>
          <Input
            placeholder="Type a name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="h-9 rounded-xl text-sm"
          />
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg max-h-48 overflow-auto">
              {results.map(m => (
                <button
                  key={m.id}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                  onClick={() => { onChange(m); setOpen(false); setQuery(''); }}
                >
                  <span className="font-medium">{m.full_name}</span>
                  {m.vanshmala_id && <span className="text-[10px] text-muted-foreground ml-auto">{m.vanshmala_id}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const RelationshipFinder = ({ isOpen, onClose, members, relationships }: RelationshipFinderProps) => {
  const { t } = useLanguage();
  const [memberA, setMemberA] = useState<Member | null>(null);
  const [memberB, setMemberB] = useState<Member | null>(null);

  const result = useMemo(() => {
    if (!memberA || !memberB) return null;
    if (memberA.id === memberB.id) return { path: [], relationText: t('Same person', 'एक ही व्यक्ति') };
    return calculateKinship(memberA.id, memberB.id, members, relationships);
  }, [memberA, memberB, members, relationships, t]);

  const handleClose = () => {
    setMemberA(null);
    setMemberB(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-orange-600" />
            {t('Find Relationship', 'रिश्ता खोजें')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <MemberPicker
            members={members}
            value={memberA}
            onChange={setMemberA}
            label={t('Person A', 'व्यक्ति A')}
          />
          <MemberPicker
            members={members}
            value={memberB}
            onChange={setMemberB}
            label={t('Person B', 'व्यक्ति B')}
          />

          {result && (
            <div className="mt-4 p-4 rounded-xl bg-accent/50 border text-center">
              {result.relationText === t('Same person', 'एक ही व्यक्ति') ? (
                <p className="text-sm text-muted-foreground">{result.relationText}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {memberA?.full_name} → {memberB?.full_name}
                  </p>
                  <p className="text-lg font-bold text-foreground">{result.relationText}</p>
                  <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {memberA?.full_name}
                    </span>
                    {result.path.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground italic">{step}</span>
                      </span>
                    ))}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {memberB?.full_name}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {memberA && memberB && !result && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-sm text-destructive">
                {t('No relationship path found between these two members.', 'इन दो सदस्यों के बीच कोई रिश्ता नहीं मिला।')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
