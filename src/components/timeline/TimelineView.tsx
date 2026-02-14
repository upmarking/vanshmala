import { useState, useEffect } from 'react';
import { TimelineEvent } from '@/types/schema';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, GraduationCap, Briefcase, Heart, Baby, Skull, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddMilestoneDialog } from './AddMilestoneDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface TimelineViewProps {
    memberId: string;
    isEditable: boolean;
}

export const TimelineView = ({ memberId, isEditable }: TimelineViewProps) => {
    const { t } = useLanguage();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('timeline_events')
                .select('*')
                .eq('family_member_id', memberId)
                .order('date', { ascending: true });

            if (error) throw error;

            // Parse media_urls as it comes as jsonb
            const parsedData = (data || []).map(event => ({
                ...event,
                media_urls: typeof event.media_urls === 'string' ? JSON.parse(event.media_urls) : event.media_urls
            })) as TimelineEvent[];

            setEvents(parsedData);
        } catch (error) {
            console.error('Error fetching timeline:', error);
            toast.error(t('Failed to load timeline', 'टाइमलाइन लोड करने में विफल'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) {
            fetchEvents();
        }
    }, [memberId]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'birth': return <Baby className="w-5 h-5" />;
            case 'education': return <GraduationCap className="w-5 h-5" />;
            case 'career': return <Briefcase className="w-5 h-5" />;
            case 'marriage': return <Heart className="w-5 h-5" />;
            case 'death': return <Skull className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'birth': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'education': return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'career': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'marriage': return 'bg-pink-100 text-pink-600 border-pink-200';
            case 'death': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-green-100 text-green-600 border-green-200';
        }
    };

    if (loading) return <div className="p-4 text-center text-muted-foreground">{t('Loading timeline...', 'टाइमलाइन लोड हो रही है...')}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg font-semibold">{t('Life Journey', 'जीवन यात्रा')}</h3>
                {isEditable && (
                    <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('Add Milestone', 'पड़ाव जोड़ें')}
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[400px] pr-4">
                <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-8">
                    {events.length === 0 ? (
                        <div className="ml-8 text-muted-foreground italic">
                            {t('No milestones added yet.', 'अभी तक कोई पड़ाव नहीं जोड़ा गया।')}
                        </div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="relative ml-8 group">
                                {/* Timeline Dot */}
                                <span className={`absolute -left-[43px] flex items-center justify-center w-8 h-8 rounded-full border-2 ${getColor(event.event_type)} bg-background z-10`}>
                                    {getIcon(event.event_type)}
                                </span>

                                {/* Content Card */}
                                <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-base">{event.title}</h4>
                                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {event.date ? format(new Date(event.date), 'PPP') : t('Date unknown', 'तारीख अज्ञात')}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider ${getColor(event.event_type)} bg-opacity-20`}>
                                            {t(event.event_type, event.event_type)}
                                        </span>
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{event.description}</p>
                                    )}

                                    {/* Media Attachments */}
                                    {event.media_urls && event.media_urls.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {event.media_urls.map((media, idx) => (
                                                <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border">
                                                    {media.type === 'image' ? (
                                                        <img src={media.url} alt={media.caption || 'Timeline photo'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <AddMilestoneDialog
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                memberId={memberId}
                onSuccess={fetchEvents}
            />
        </div>
    );
};
