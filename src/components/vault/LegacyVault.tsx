import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LegacyMessage } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, Play, FileText, Video, Mic, Plus, Trash2, Users, User as UserIcon } from 'lucide-react';
import { RecordMessageDialog } from './RecordMessageDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

type LegacyMessageWithRecipient = LegacyMessage & {
    target_family_member?: {
        id: string;
        full_name: string;
        full_name_hi: string | null;
    }
}

export const LegacyVault = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('received');
    const [messages, setMessages] = useState<LegacyMessageWithRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [recordOpen, setRecordOpen] = useState(false);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase.from('legacy_messages').select(`
                *,
                target_family_member:family_members!legacy_messages_target_family_member_id_fkey(id, full_name, full_name_hi)
            `);

            if (activeTab === 'my_recordings') {
                query = query.eq('creator_id', user.id);
            } else {
                query = query.or(`recipient_id.eq.${user.id},recipient_id.is.null`).eq('is_unlocked', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMessages(data as LegacyMessageWithRecipient[]);
        } catch (error) {
            console.error('Error loading vault:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('Are you sure you want to delete this recording?', 'क्या आप इस रिकॉर्डिंग को हटाना चाहते हैं?'))) return;

        try {
            const { error } = await supabase
                .from('legacy_messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success(t('Recording deleted', 'रिकॉर्डिंग हटा दी गई'));
            fetchMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error(t('Failed to delete message', 'संदेश हटाने में विफल'));
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [activeTab]);

    return (
        <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-saffron-800">{t('Legacy Vault', 'विरासत तिजोरी')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Preserve your voice and blessings for future generations.', 'भावी पीढ़ियों के लिए अपनी आवाज और आशीर्वाद सुरक्षित रखें।')}</p>
                </div>
                <Button onClick={() => setRecordOpen(true)} className="gap-2 bg-gradient-saffron text-white shadow-saffron">
                    <Plus className="w-4 h-4" />
                    {t('Record New Message', 'नया संदेश रिकॉर्ड करें')}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="received">{t('Received Messages', 'प्राप्त संदेश')}</TabsTrigger>
                    <TabsTrigger value="my_recordings">{t('My Recordings', 'मेरी रिकॉर्डिंग')}</TabsTrigger>
                </TabsList>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-10 text-muted-foreground">{t('Loading vault...', 'तिजोरी लोड हो रही है...')}</div>
                    ) : messages.length === 0 ? (
                        <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg bg-muted/50">
                            <Lock className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <p>{t('No messages found in this section.', 'इस अनुभाग में कोई संदेश नहीं मिला।')}</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <Card key={msg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{msg.title}</CardTitle>
                                        {msg.content_type === 'video' ? <Video className="w-5 h-5 text-blue-500" /> :
                                            msg.content_type === 'audio' ? <Mic className="w-5 h-5 text-purple-500" /> :
                                                <FileText className="w-5 h-5 text-gray-500" />}
                                    </div>
                                    <CardDescription>
                                        {format(new Date(msg.created_at), 'PPP')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm">
                                                {msg.is_unlocked ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <Unlock className="w-3 h-3" /> {t('Unlocked', 'अनलॉक')}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 flex items-center gap-1">
                                                        <Lock className="w-3 h-3" /> {t('Locked until', 'अनलॉक होगा')} {msg.unlock_date}
                                                    </span>
                                                )}
                                            </div>
                                            {msg.media_url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                                                        <Play className="w-4 h-4 mr-1" /> {t('Play', 'चलाएं')}
                                                    </a>
                                                </Button>
                                            )}
                                        </div>

                                        {activeTab === 'my_recordings' && (
                                            <div className="flex flex-col gap-2 pt-2 border-t">
                                                {msg.target_family_member ? (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <UserIcon className="w-3 h-3" />
                                                        {t('For:', 'के लिए:')} {msg.target_family_member.full_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {t('For: All Family', 'के लिए: सभी परिवार')}
                                                    </span>
                                                )}

                                                <div className="flex justify-end mt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(msg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </Tabs>

            <RecordMessageDialog
                isOpen={recordOpen}
                onClose={() => setRecordOpen(false)}
                onSuccess={() => {
                    if (activeTab === 'my_recordings') fetchMessages();
                    else setActiveTab('my_recordings');
                }}
            />
        </div>
    );
};
