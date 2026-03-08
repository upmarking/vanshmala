import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['family_members']['Row'];

interface TreeSearchBarProps {
  members: Member[];
  onSelect: (member: Member) => void;
}

export const TreeSearchBar = ({ members, onSelect }: TreeSearchBarProps) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.full_name_hi?.toLowerCase().includes(q) ||
      m.vanshmala_id?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, members]);

  const handleSelect = (member: Member) => {
    onSelect(member);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('Search member...', 'सदस्य खोजें...')}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-8 h-9 rounded-xl text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg max-h-60 overflow-auto">
          {results.map(m => (
            <button
              key={m.id}
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
              onClick={() => handleSelect(m)}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{m.full_name[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{m.full_name}</p>
                {m.vanshmala_id && <p className="text-[10px] text-muted-foreground">{m.vanshmala_id}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg p-3 text-sm text-muted-foreground text-center">
          {t('No members found', 'कोई सदस्य नहीं मिला')}
        </div>
      )}
    </div>
  );
};
