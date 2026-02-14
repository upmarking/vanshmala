
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Tag {
    id: string;
    name: string;
    category: string;
    tree_id: string | null;
}

interface TagSelectorProps {
    treeId: string;
    profileId?: string; // If provided, we manage profile tags directly. If not, we just return selected tags.
    selectedTagIds?: string[];
    onTagsChange?: (tags: Tag[]) => void;
    readOnly?: boolean;
}

export const TagSelector = ({ treeId, profileId, selectedTagIds = [], onTagsChange, readOnly = false }: TagSelectorProps) => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTags();
    }, [treeId]);

    useEffect(() => {
        if (profileId) {
            fetchProfileTags();
        } else if (selectedTagIds.length > 0 && availableTags.length > 0) {
            // detailed tags from IDs
            const preselected = availableTags.filter(t => selectedTagIds.includes(t.id));
            setSelectedTags(preselected);
        }
    }, [profileId, availableTags, selectedTagIds]);

    const fetchTags = async () => {
        setLoading(true);
        // Fetch system tags (tree_id is null) and tree-specific tags
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .or(`tree_id.eq.${treeId},tree_id.is.null`)
            .order('name');

        if (error) {
            console.error('Error fetching tags:', error);
        } else {
            setAvailableTags(data as Tag[]);
        }
        setLoading(false);
    };

    const fetchProfileTags = async () => {
        if (!profileId) return;
        const { data, error } = await supabase
            .from('profile_tags')
            .select('tag_id, tags(*)')
            .eq('profile_id', profileId);

        if (error) {
            console.error('Error fetching profile tags:', error);
        } else {
            const tags = data.map((pt: any) => pt.tags) as Tag[];
            setSelectedTags(tags);
            onTagsChange?.(tags); // Sync content
        }
    };

    const handleSelectTag = async (tag: Tag) => {
        const isSelected = selectedTags.some(t => t.id === tag.id);
        let newTags = [];
        if (isSelected) {
            newTags = selectedTags.filter(t => t.id !== tag.id);
        } else {
            newTags = [...selectedTags, tag];
        }
        setSelectedTags(newTags);
        onTagsChange?.(newTags);

        if (profileId) {
            // Persist immediately if profileId is present
            if (isSelected) {
                await supabase.from('profile_tags').delete().eq('profile_id', profileId).eq('tag_id', tag.id);
            } else {
                await supabase.from('profile_tags').insert({ profile_id: profileId, tag_id: tag.id });
            }
        }
        setOpen(false);
    };

    const handleCreateTag = async () => {
        if (!inputValue.trim()) return;

        // Check duplicates
        if (availableTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase())) {
            toast.error(t('Tag already exists', 'टैग पहले से मौजूद है'));
            return;
        }

        try {
            const user = (await supabase.auth.getUser()).data.user;
            const newTag = {
                tree_id: treeId,
                name: inputValue.trim(),
                category: 'Custom',
                created_by: user?.id,
            };

            const { data, error } = await supabase.from('tags').insert(newTag).select().single();
            if (error) throw error;

            setAvailableTags([...availableTags, data as Tag]);
            handleSelectTag(data as Tag);
            setInputValue('');
            toast.success(t('Tag created', 'टैग बनाया गया'));
        } catch (error: any) {
            toast.error(t('Failed to create tag', 'टैग बनाने में विफल') + ': ' + error.message);
        }
    };

    if (readOnly) {
        return (
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="secondary">
                        {tag.name}
                    </Badge>
                ))}
                {selectedTags.length === 0 && <span className="text-muted-foreground text-sm">{t('No tags', 'कोई टैग नहीं')}</span>}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between w-full"
                    >
                        {selectedTags.length > 0
                            ? `${selectedTags.length} ${t('tags selected', 'टैग चुने गए')}`
                            : t('Select tags...', 'टैग चुनें...')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={t("Search tags...", "टैग खोजें...")} value={inputValue} onValueChange={setInputValue} />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2">
                                    <p className="text-sm text-muted-foreground mb-2">{t('No tags found.', 'कोई टैग नहीं मिला।')}</p>
                                    {inputValue && (
                                        <Button variant="outline" size="sm" className="w-full" onClick={handleCreateTag}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            {t(`Create "${inputValue}"`, `"${inputValue}" बनाएँ`)}
                                        </Button>
                                    )}
                                </div>
                            </CommandEmpty>
                            <CommandGroup heading={t("System Tags", "सिस्टम टैग")}>
                                {availableTags.filter(t => !t.tree_id).map((tag) => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => handleSelectTag(tag)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading={t("Custom Tags", "कस्टम टैग")}>
                                {availableTags.filter(t => t.tree_id === treeId).map((tag) => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => handleSelectTag(tag)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                        {tag.name}
                        <button
                            onClick={() => handleSelectTag(tag)}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Remove</span>
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
};
