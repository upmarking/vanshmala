import { useParams } from 'react-router-dom';
import { useMemberByUsername } from '@/hooks/useFamilyTree';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

const PublicProfile = () => {
    const { username } = useParams<{ username: string }>();
    const { data: member, isLoading, error } = useMemberByUsername(username || '');
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 container max-w-4xl mx-auto pt-24 px-4">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
                        <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
                        <div className="flex-1 space-y-4 w-full">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">{t('Profile not found', 'प्रोफ़ाइल नहीं मिली')}</h2>
                        <p className="text-muted-foreground">{t("The user you're looking for doesn't exist.", "वह उपयोगकर्ता मौजूद नहीं है जिसे आप खोज रहे हैं।")}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Parse JSON fields safely
    const education = Array.isArray(member.education) ? member.education : [];
    const career = Array.isArray(member.career) ? member.career : [];
    const privacy = (member.privacy_settings as any) || {};

    const isFieldVisible = (field: string) => {
        // Implement privacy logic here. 
        // For now, assuming public view:
        // if privacy[field] === 'private' -> return false
        // if privacy[field] === 'family' -> return false (unless logged in & family - TODO)
        // default -> true or check specific defaults
        const setting = privacy[field];
        if (setting === 'private') return false;
        // if (setting === 'family') return isFamily; 
        return true;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 container max-w-4xl mx-auto pt-24 pb-16 px-4">

                {/* Header Section (Instagram Style) */}
                <header className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start mb-12">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-saffron to-purple-500">
                            <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-light">{member.username}</h1>
                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="font-semibold px-6">{t('Message', 'संदेश')}</Button>
                                <Button variant="secondary" size="sm"><User className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {/* Stats - Placeholder logic */}
                        <div className="flex justify-center md:justify-start gap-8 text-sm md:text-base border-y md:border-none py-4 md:py-0 border-border/40">
                            <div className="flex md:gap-1"><span className="font-semibold">0</span> {t('posts', 'पोस्ट')}</div>
                            <div className="flex md:gap-1"><span className="font-semibold">0</span> {t('relatives', 'रिश्तेदार')}</div>
                            <div className="flex md:gap-1"><span className="font-semibold">{member.generation_level || 0}</span> {t('gen', 'पीढ़ी')}</div>
                        </div>

                        {/* Bio Name & Details */}
                        <div className="space-y-1 text-sm md:text-base">
                            <div className="font-semibold">{member.full_name} {member.full_name_hi && <span className="font-normal text-muted-foreground">({member.full_name_hi})</span>}</div>
                            {isFieldVisible('bio') && member.bio && (
                                <p className="whitespace-pre-wrap">{member.bio}</p>
                            )}

                            <div className="text-muted-foreground flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-2">
                                {isFieldVisible('place_of_birth') && member.place_of_birth && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {member.place_of_birth}
                                    </div>
                                )}
                                {isFieldVisible('blood_group') && member.blood_group && (
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" /> {member.blood_group}
                                    </div>
                                )}
                                {isFieldVisible('work') && career.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> {(career[0] as any)?.role || 'Professional'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Tabs */}
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-transparent border-t rounded-none h-12 p-0">
                        <TabsTrigger
                            value="about"
                            className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none bg-transparent"
                        >
                            <span className="uppercase text-xs tracking-widest font-semibold flex items-center gap-2">
                                <User className="w-3 h-3" /> <span className="hidden md:inline">{t('ABOUT', 'परिचय')}</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="education"
                            className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none bg-transparent"
                        >
                            <span className="uppercase text-xs tracking-widest font-semibold flex items-center gap-2">
                                <GraduationCap className="w-3 h-3" /> <span className="hidden md:inline">{t('EDUCATION', 'शिक्षा')}</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="work"
                            className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none bg-transparent"
                        >
                            <span className="uppercase text-xs tracking-widest font-semibold flex items-center gap-2">
                                <Briefcase className="w-3 h-3" /> <span className="hidden md:inline">{t('WORK', 'कार्य')}</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="family"
                            className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none bg-transparent"
                        >
                            <span className="uppercase text-xs tracking-widest font-semibold flex items-center gap-2">
                                <Users className="w-3 h-3" /> <span className="hidden md:inline">{t('FAMILY', 'परिवार')}</span>
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-8 min-h-[300px]">
                        <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Basic Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isFieldVisible('dob') && member.date_of_birth && (
                                    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('Born', 'जन्म')}</div>
                                        <div className="text-lg font-medium">{new Date(member.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                    </div>
                                )}
                                {isFieldVisible('place_of_birth') && member.place_of_birth && (
                                    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('From', 'निवासी')}</div>
                                        <div className="text-lg font-medium">{member.place_of_birth}</div>
                                    </div>
                                )}
                                {isFieldVisible('gotra') && member.gotra && (
                                    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('Gotra', 'गोत्र')}</div>
                                        <div className="text-lg font-medium">{member.gotra}</div>
                                    </div>
                                )}
                                {isFieldVisible('marriage_date') && member.marriage_date && (
                                    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('Married', 'विवाहित')}</div>
                                        <div className="text-lg font-medium">{new Date(member.marriage_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="education" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isFieldVisible('education') && education.length > 0 ? (
                                <div className="space-y-4">
                                    {(education as any[]).map((edu, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{edu.school || edu.institution}</h3>
                                                <p className="text-muted-foreground">{edu.degree} {edu.field_of_study && `• ${edu.field_of_study}`}</p>
                                                <p className="text-sm text-muted-foreground/80 mt-1">
                                                    {edu.start_year} - {edu.end_year || t('Present', 'वर्तमान')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    {t('No education information shared', 'कोई शिक्षा जानकारी साझा नहीं की गई')}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="work" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isFieldVisible('career') && career.length > 0 ? (
                                <div className="space-y-4">
                                    {(career as any[]).map((job, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{job.role || job.title}</h3>
                                                <p className="text-muted-foreground">{job.company} {job.location && `• ${job.location}`}</p>
                                                <p className="text-sm text-muted-foreground/80 mt-1">
                                                    {job.start_date} - {job.end_date || t('Present', 'वर्तमान')}
                                                </p>
                                                {job.description && (
                                                    <p className="text-sm mt-2 text-foreground/80">{job.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    {t('No career information shared', 'कोई करियर जानकारी साझा नहीं की गई')}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="family" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* This would require fetching relations. For now, placeholder or link to tree */}
                            <div className="text-center py-12">
                                <div className="max-w-sm mx-auto space-y-4">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground">
                                        {t('View full family tree to see connections.', 'कनेक्शन देखने के लिए पूर्ण वंशवृक्ष देखें।')}
                                    </p>
                                    <Button variant="outline" onClick={() => window.location.href = `/tree/${member.tree_id}`}>
                                        {t('View Family Tree', 'वंशवृक्ष देखें')}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
            <Footer />
        </div>
    );
};

export default PublicProfile;
