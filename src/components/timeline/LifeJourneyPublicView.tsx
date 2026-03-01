import { useLanguage } from '@/contexts/LanguageContext';
import { useTimelineEvents } from '@/hooks/useFamilyTree';
import { format } from 'date-fns';
import {
    Baby, Scissors, GraduationCap, Briefcase, Heart, Star, Users,
    Calendar, FileText, Sparkles, Skull
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LifeJourneyPublicViewProps {
    memberId: string;
    member: any;
    privacy?: Record<string, string>;
}

interface JourneyItem {
    id: string;
    title: string;
    subtitle?: string;
    date: string | null;
    event_type: string;
    description?: string | null;
    source: 'timeline' | 'profile';
}

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string; label_hi: string }> = {
    birth: { icon: <Baby className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800', label: 'Birth', label_hi: 'जन्म' },
    mundan: { icon: <Scissors className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', label: 'Mundan', label_hi: 'मुंडन' },
    education: { icon: <GraduationCap className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', label: 'Education', label_hi: 'शिक्षा' },
    career: { icon: <Briefcase className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', label: 'Career', label_hi: 'करियर' },
    marriage: { icon: <Heart className="w-5 h-5" />, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800', label: 'Marriage', label_hi: 'विवाह' },
    child: { icon: <Users className="w-5 h-5" />, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800', label: 'Family', label_hi: 'परिवार' },
    death: { icon: <Skull className="w-5 h-5" />, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800', label: 'Passed', label_hi: 'निधन' },
    other: { icon: <Star className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800', label: 'Milestone', label_hi: 'पड़ाव' },
};

function getConfig(type: string) {
    return EVENT_CONFIG[type] ?? EVENT_CONFIG['other'];
}

function sortKey(item: JourneyItem): number {
    if (!item.date) return Infinity;
    return new Date(item.date).getTime();
}

export const LifeJourneyPublicView = ({ memberId, member, privacy = {} }: LifeJourneyPublicViewProps) => {
    const { t } = useLanguage();
    const { data: timelineEvents = [], isLoading } = useTimelineEvents(memberId);

    const isVisible = (field: string) => {
        return privacy[field] !== 'private';
    };

    // Build unified event list from timeline_events + profile derived data
    const items: JourneyItem[] = [
        // 1. All timeline_events
        ...timelineEvents.map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            event_type: e.event_type,
            description: e.description,
            source: 'timeline' as const,
        })),
    ];

    // 2. Derive events from profile education (if visible and not already in timeline)
    if (isVisible('education') && Array.isArray(member?.education)) {
        const hasEducationInTimeline = timelineEvents.some(e => e.event_type === 'education');
        if (!hasEducationInTimeline) {
            (member.education as any[]).forEach((edu: any, i: number) => {
                const startYear = edu.start_year ? `${edu.start_year}-01-01` : null;
                items.push({
                    id: `edu-${i}`,
                    title: edu.degree || edu.school || t('Education', 'शिक्षा'),
                    subtitle: edu.school || edu.institution,
                    date: startYear,
                    event_type: 'education',
                    description: edu.start_year && edu.end_year
                        ? `${edu.start_year} – ${edu.end_year || t('Present', 'वर्तमान')}`
                        : null,
                    source: 'profile' as const,
                });
            });
        }
    }

    // 3. Derive events from profile career (if visible and not already in timeline)
    if (isVisible('career') && Array.isArray(member?.career)) {
        const hasCareerInTimeline = timelineEvents.some(e => e.event_type === 'career');
        if (!hasCareerInTimeline) {
            (member.career as any[]).forEach((job: any, i: number) => {
                const startDate = job.start_date ? new Date(job.start_date + '-01').toISOString() : null;
                items.push({
                    id: `career-${i}`,
                    title: job.role || job.title || t('Work', 'काम'),
                    subtitle: job.company,
                    date: startDate,
                    event_type: 'career',
                    description: job.start_date
                        ? `${job.start_date} – ${job.end_date || t('Present', 'वर्तमान')}`
                        : null,
                    source: 'profile' as const,
                });
            });
        }
    }

    // 4. Marriage date from profile (if visible and not already in timeline)
    if (isVisible('marriage_date') && member?.marriage_date) {
        const hasMarriageInTimeline = timelineEvents.some(e => e.event_type === 'marriage');
        if (!hasMarriageInTimeline) {
            items.push({
                id: 'marriage-profile',
                title: t('Wedding Day', 'विवाह'),
                date: member.marriage_date,
                event_type: 'marriage',
                description: null,
                source: 'profile' as const,
            });
        }
    }

    // Sort chronologically
    items.sort((a, b) => sortKey(a) - sortKey(b));

    if (isLoading) {
        return (
            <div className="space-y-6 py-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">{t('No journey milestones yet', 'अभी तक कोई पड़ाव नहीं')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t('This person\'s life story will appear here.', 'इस व्यक्ति की जीवन कहानी यहाँ दिखाई देगी।')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative py-2">
            {/* Vertical stem line */}
            <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-saffron/60 via-muted-foreground/20 to-transparent" />

            <div className="space-y-1">
                {items.map((item, index) => {
                    const cfg = getConfig(item.event_type);
                    const isLast = index === items.length - 1;

                    return (
                        <div
                            key={item.id}
                            className="group relative flex gap-5 items-start animate-in fade-in slide-in-from-left-4 duration-500"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            {/* Icon dot on stem */}
                            <div className={cn(
                                'relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                                cfg.bg, cfg.color
                            )}>
                                {cfg.icon}
                            </div>

                            {/* Card */}
                            <div className={cn(
                                'flex-1 pb-8 mb-0',
                                isLast && 'pb-0'
                            )}>
                                <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                                    <div className="flex flex-wrap items-start gap-2 justify-between">
                                        <div>
                                            <h4 className="font-semibold text-base leading-tight">{item.title}</h4>
                                            {item.subtitle && (
                                                <p className="text-sm text-muted-foreground mt-0.5">{item.subtitle}</p>
                                            )}
                                        </div>
                                        <span className={cn(
                                            'text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider flex-shrink-0',
                                            cfg.bg, cfg.color
                                        )}>
                                            {t(cfg.label, cfg.label_hi)}
                                        </span>
                                    </div>

                                    {item.date && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(item.date), 'PPP')}
                                        </div>
                                    )}

                                    {item.description && (
                                        <p className="text-sm text-foreground/75 mt-2 whitespace-pre-wrap">{item.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
