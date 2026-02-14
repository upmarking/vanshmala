
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
    id: string;
    name: string;
    category: string;
    tree_id: string | null;
    created_at: string;
}

export const TagManager = ({ treeId }: { treeId: string }) => {
    const { t } = useLanguage();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchTags();
    }, [treeId]);

    const fetchTags = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('tree_id', treeId) // Only custom tags for this tree
            .order('name');

        if (error) {
            toast.error(t('Failed to load tags', 'टैग लोड करने में विफल'));
        } else {
            setTags(data as Tag[]);
        }
        setLoading(false);
    };

    const handleDelete = async (tagId: string) => {
        if (!confirm(t('Are you sure? This will remove the tag from all profiles.', 'क्या आपको यकीन है? यह सभी प्रोफ़ाइल से टैग हटा देगा।'))) return;

        try {
            const { error } = await supabase.from('tags').delete().eq('id', tagId);
            if (error) throw error;
            toast.success(t('Tag deleted', 'टैग हटा दिया गया'));
            fetchTags();
        } catch (error: any) {
            toast.error(t('Failed to delete tag', 'टैग हटाने में विफल') + ': ' + error.message);
        }
    };

    const startEdit = (tag: Tag) => {
        setEditingTag(tag.id);
        setEditName(tag.name);
    };

    const cancelEdit = () => {
        setEditingTag(null);
        setEditName('');
    };

    const saveEdit = async (tagId: string) => {
        if (!editName.trim()) return;

        try {
            const { error } = await supabase
                .from('tags')
                .update({ name: editName.trim() })
                .eq('id', tagId);

            if (error) throw error;

            toast.success(t('Tag updated', 'टैग अपडेट किया गया'));
            setEditingTag(null);
            fetchTags();
        } catch (error: any) {
            toast.error(t('Failed to update tag', 'टैग अपडेट करने में विफल') + ': ' + error.message);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin mx-auto" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Manage Custom Tags', 'कस्टम टैग प्रबंधित करें')}</CardTitle>
            </CardHeader>
            <CardContent>
                {tags.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{t('No custom tags found.', 'कोई कस्टम टैग नहीं मिला।')}</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name', 'नाम')}</TableHead>
                                <TableHead className="w-[100px]">{t('Actions', 'क्रियाएँ')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.map((tag) => (
                                <TableRow key={tag.id}>
                                    <TableCell>
                                        {editingTag === tag.id ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8"
                                            />
                                        ) : (
                                            <Badge variant="secondary">{tag.name}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {editingTag === tag.id ? (
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => saveEdit(tag.id)} className="h-8 w-8 text-green-600">
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8 text-muted-foreground">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => startEdit(tag)} className="h-8 w-8">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)} className="h-8 w-8 text-destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
