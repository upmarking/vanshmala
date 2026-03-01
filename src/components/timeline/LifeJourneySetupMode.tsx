import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAddTimelineEvent, useTimelineEvents, useUpdateMember } from '@/hooks/useFamilyTree';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    Baby, Scissors, GraduationCap, Briefcase, Heart, Star, Plus,
    CheckCircle2, ChevronRight, Calendar, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LifeJourneySetupModeProps {
    memberId: string;
    member: any;
}

interface Prompt {
    key: string;
    event_type: string;
    question: string;
    question_hi: string;
    description: string;
    description_hi: string;
    icon: React.ReactNode;
    color: string;
    defaultTitle: string;
    // If set, syncs the date back to the member profile field
    syncField?: string;
}

const PROMPTS: Prompt[] = [
    {
        key: 'birth',
        event_type: 'birth',
        question: 'When were you born?',
        question_hi: 'आपका जन्म कब हुआ था?',
        description: 'The beginning of your journey.',
        description_hi: 'आपकी यात्रा की शुरुआत।',
        icon: <Baby className="w-5 h-5" />,
        color: 'from-blue-400 to-cyan-400',
        defaultTitle: 'Born',
    },
    {
        key: 'mundan',
        event_type: 'other',
        question: 'Did you have a Mundan ceremony?',
        question_hi: 'क्या आपका मुंडन संस्कार हुआ था?',
        description: 'First haircut ceremony — a sacred tradition.',
        description_hi: 'मुंडन संस्कार — एक पावन परंपरा।',
        icon: <Scissors className="w-5 h-5" />,
        color: 'from-orange-400 to-amber-400',
        defaultTitle: 'Mundan Ceremony',
    },
    {
        key: 'education',
        event_type: 'education',
        question: 'When did you start your education?',
        question_hi: 'आपकी शिक्षा कब शुरू हुई?',
        description: 'First day of school or college.',
        description_hi: 'स्कूल या कॉलेज का पहला दिन।',
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'from-purple-400 to-indigo-400',
        defaultTitle: 'Started Education',
    },
    {
        key: 'first_job',
        event_type: 'career',
        question: 'When did you get your first job?',
        question_hi: 'आपको पहली नौकरी कब मिली?',
        description: 'Your professional journey began here.',
        description_hi: 'आपकी पेशेवर यात्रा यहाँ से शुरू हुई।',
        icon: <Briefcase className="w-5 h-5" />,
        color: 'from-amber-400 to-yellow-400',
        defaultTitle: 'First Job',
    },
    {
        key: 'marriage',
        event_type: 'marriage',
        question: 'When did you get married?',
        question_hi: 'आपकी शादी कब हुई?',
        description: 'A union that changed everything.',
        description_hi: 'एक मिलन जिसने सब कुछ बदल दिया।',
        icon: <Heart className="w-5 h-5" />,
        color: 'from-pink-400 to-rose-400',
        defaultTitle: 'Wedding Day',
        syncField: 'marriage_date',
    },
    {
        key: 'other',
        event_type: 'other',
        question: 'Anything else important in your life?',
        question_hi: 'आपके जीवन में और कोई महत्वपूर्ण घटना?',
        description: 'Awards, achievements, moves, and more.',
        description_hi: 'पुरस्कार, उपलब्धियाँ, स्थानांतरण, और अधिक।',
        icon: <Star className="w-5 h-5" />,
        color: 'from-green-400 to-emerald-400',
        defaultTitle: 'Special Milestone',
    },
];

export const LifeJourneySetupMode = ({ memberId, member }: LifeJourneySetupModeProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { data: existingEvents = [], refetch } = useTimelineEvents(memberId);
    const { mutateAsync: addEvent } = useAddTimelineEvent();
    const { mutate: updateMember } = useUpdateMember();

    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [formData, setFormData] = useState({ date: '', note: '', title: '', customTitle: '' });
    const [saving, setSaving] = useState(false);

    // Check which event_types are already saved
    const savedTypes = new Set(existingEvents.map(e => e.event_type));

    const isPromptDone = (prompt: Prompt) => {
        // Special case: mundan and first_job use 'other'/'career' with a title match
        if (prompt.key === 'mundan') return existingEvents.some(e => e.title?.toLowerCase().includes('mundan'));
        if (prompt.key === 'first_job') return existingEvents.some(e => e.title?.toLowerCase().includes('first job') || e.title?.toLowerCase().includes('पहली नौक'));
        if (prompt.key === 'other') return existingEvents.some(e => e.event_type === 'other' && !e.title?.toLowerCase().includes('mundan'));
        return savedTypes.has(prompt.event_type as any);
    };

    const handleSave = async () => {
        if (!selectedPrompt) return;
        setSaving(true);
        try {
            const title = formData.customTitle.trim() || formData.title.trim() || selectedPrompt.defaultTitle;
            await addEvent({
                family_member_id: memberId,
                title,
                date: formData.date ? new Date(formData.date).toISOString() : null,
                event_type: selectedPrompt.event_type,
                description: formData.note || undefined,
                created_by: user?.id || null,
            });

            // Sync back to profile if applicable
            if (selectedPrompt.syncField && formData.date) {
                updateMember({ memberId, updates: { [selectedPrompt.syncField]: formData.date } });
            }

            toast.success(t('Milestone saved!', 'पड़ाव सहेजा गया!'));
            await refetch();
            setSelectedPrompt(null);
            setFormData({ date: '', note: '', title: '', customTitle: '' });
        } catch (err: any) {
            toast.error(t('Failed to save: ' + err.message, 'सहेजने में विफल: ' + err.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saffron/20 via-orange-50 to-pink-50 dark:from-saffron/10 dark:via-orange-950/30 dark:to-pink-950/30 p-6 border border-saffron/20">
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
                    <Sparkles className="w-full h-full text-saffron" />
                </div>
                <h2 className="text-xl font-display font-bold mb-1">
                    {t('Your Life Journey', 'आपकी जीवन यात्रा')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {t(
                        'Mark the moments that made you who you are. Each milestone becomes part of your story.',
                        'उन पलों को चिह्नित करें जिन्होंने आपको वह बनाया जो आप हैं। प्रत्येक पड़ाव आपकी कहानी का हिस्सा बन जाता है।'
                    )}
                </p>
            </div>

            {/* Prompt cards */}
            {!selectedPrompt ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PROMPTS.map((prompt) => {
                        const done = isPromptDone(prompt);
                        return (
                            <button
                                key={prompt.key}
                                onClick={() => {
                                    setSelectedPrompt(prompt);
                                    // Pre-fill marriage date from profile
                                    if (prompt.syncField === 'marriage_date' && member?.marriage_date) {
                                        setFormData(f => ({ ...f, date: member.marriage_date }));
                                    }
                                }}
                                className={cn(
                                    'group relative flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                                    done
                                        ? 'bg-muted/40 border-muted-foreground/20 opacity-70'
                                        : 'bg-card border-border hover:border-saffron/50 hover:shadow-md hover:-translate-y-0.5'
                                )}
                            >
                                <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0', prompt.color)}>
                                    {prompt.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm leading-snug">
                                            {t(prompt.question, prompt.question_hi)}
                                        </p>
                                        {done && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t(prompt.description, prompt.description_hi)}
                                    </p>
                                </div>
                                {!done && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-saffron transition-colors flex-shrink-0 mt-1" />
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                /* Active prompt form */
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={() => { setSelectedPrompt(null); setFormData({ date: '', note: '', title: '', customTitle: '' }); }}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                        ← {t('Back', 'वापस')}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-lg', selectedPrompt.color)}>
                            {selectedPrompt.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{t(selectedPrompt.question, selectedPrompt.question_hi)}</h3>
                            <p className="text-sm text-muted-foreground">{t(selectedPrompt.description, selectedPrompt.description_hi)}</p>
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl p-5 space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">{t('Event Name', 'घटना का नाम')}</label>
                            <Input
                                value={formData.customTitle}
                                onChange={e => setFormData(f => ({ ...f, customTitle: e.target.value }))}
                                placeholder={selectedPrompt.defaultTitle}
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {t('When did this happen?', 'यह कब हुआ?')}
                            </label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('Month and year is enough if you don\'t recall the exact date.', 'यदि आपको सटीक तारीख याद नहीं है तो महीना और वर्ष पर्याप्त है।')}
                            </p>
                        </div>

                        {/* Note */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">{t('Add a note (optional)', 'नोट जोड़ें (वैकल्पिक)')}</label>
                            <Textarea
                                value={formData.note}
                                onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                                placeholder={t('Share a memory or detail about this moment...', 'इस पल के बारे में एक याद या विवरण साझा करें...')}
                                className="h-20"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => { setSelectedPrompt(null); setFormData({ date: '', note: '', title: '', customTitle: '' }); }}
                            className="flex-1"
                        >
                            {t('Cancel', 'रद्द करें')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-gradient-saffron text-white shadow-saffron"
                        >
                            {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            {t('Add to My Journey', 'मेरी यात्रा में जोड़ें')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Mini preview of existing events */}
            {existingEvents.length > 0 && !selectedPrompt && (
                <div className="pt-2 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('Your journey so far', 'अब तक की आपकी यात्रा')} · {existingEvents.length} {t('milestones', 'पड़ाव')}
                    </p>
                    <div className="space-y-2">
                        {existingEvents.slice(0, 5).map(event => (
                            <div key={event.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                                <div className="w-2 h-2 rounded-full bg-saffron flex-shrink-0" />
                                <span className="font-medium">{event.title}</span>
                                {event.date && (
                                    <span className="text-muted-foreground ml-auto flex-shrink-0">
                                        {format(new Date(event.date), 'MMM yyyy')}
                                    </span>
                                )}
                            </div>
                        ))}
                        {existingEvents.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                                +{existingEvents.length - 5} {t('more', 'और')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
