import { useParams, Link } from 'react-router-dom';
import { useMemberByUsername, useUserFeedPosts, useTreeMembers } from '@/hooks/useFamilyTree';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User, MapPin, Briefcase, Heart, BadgeCheck, Landmark, Sparkles, MessageCircle, UserPlus, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { LifeJourneyPublicView } from '@/components/timeline/LifeJourneyPublicView';
import { calculateKinship } from '@/utils/kinshipUtils';
import { useMemo, useState } from 'react';
import SEO from '@/components/SEO';
import { FeedItem } from '@/components/feed/FeedItem';
import { toast } from 'sonner';
import AddRelativeDialog from '@/components/profile/AddRelativeDialog';

const PublicProfile = () => {
    const { username } = useParams<{ username: string }>();
    const { user } = useAuth();
    const { data: memberData, isLoading, error } = useMemberByUsername(username || '');
    const member = memberData as any;
    const { data: treeData } = useTreeMembers(member?.tree_id || '');
    const { data: feedPosts, refetch: refetchPosts } = useUserFeedPosts(member?.user_id);
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('about');
    const [showAddRelative, setShowAddRelative] = useState(false);

    const kinship = useMemo(() => {
        if (!user?.id || !member?.id || !treeData) return null;
        const sourceMember = treeData.members?.find((m: any) => m.user_id === user.id);
        if (!sourceMember) return null;
        return calculateKinship(sourceMember.id, member.id, treeData.members as any, treeData.relationships as any);
    }, [user?.id, member?.id, treeData]);

    const handleShare = () => {
        const url = `${window.location.origin}/${member?.username}`;
        if (navigator.share) {
            navigator.share({ title: `${member?.full_name} on Vanshmala`, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url);
            toast.success(t('Profile link copied!', 'प्रोफ़ाइल लिंक कॉपी हो गया!'));
        }
    };

    const handleMessage = () => {
        toast.info(t('Messaging coming soon!', 'मैसेजिंग जल्द आ रहा है!'));
    };

    const handleAddRelative = () => {
        if (!user) {
            toast.error(t('Please login to add as relative', 'रिश्तेदार के रूप में जोड़ने के लिए लॉगिन करें'));
            return;
        }
        setShowAddRelative(true);
    };

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

    const education = Array.isArray(member.education) ? member.education : [];
    const career = Array.isArray(member.career) ? member.career : [];
    const privacy = (member.privacy_settings as any) || {};
    const isVerified = member.is_verified === true;
    const vanshmalaId = member.vanshmala_id;
    const isOwnProfile = user?.id === member.user_id;
    const postsCount = feedPosts?.length || 0;

    const isFieldVisible = (field: string) => {
        const setting = privacy[field];
        if (setting === 'private') return false;
        return true;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title={`${member?.full_name || 'User Profile'} | Vanshmala`}
                description={`View ${member?.full_name || 'this user'}'s family lineage and life journey on Vanshmala.`}
                ogImage={member?.avatar_url}
            />
            <Navbar />
            <div className="flex-1 container max-w-4xl mx-auto pt-24 pb-16 px-4">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start mb-12">
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

                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-light flex items-center gap-2">
                                {member.username}
                                {isVerified && (
                                    <svg viewBox="0 0 22 22" className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" aria-label="Verified">
                                        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.141.27.587.7 1.086 1.24 1.44s1.167.551 1.813.568c.647-.017 1.277-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.27 1.894.14.634-.132 1.22-.438 1.69-.884.445-.47.75-1.055.88-1.69.13-.634.085-1.29-.138-1.896.587-.273 1.084-.705 1.438-1.246.355-.54.552-1.17.57-1.817z" fill="#1D9BF0"/>
                                        <path d="M9.585 14.929l-3.28-3.28 1.168-1.168 2.112 2.112 5.036-5.036 1.168 1.168z" fill="white"/>
                                    </svg>
                                )}
                            </h1>
                            {/* Action Buttons */}
                            {!isOwnProfile && (
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="font-semibold px-5 gap-1.5" onClick={handleMessage}>
                                        <MessageCircle className="w-4 h-4" />
                                        {t('Message', 'संदेश')}
                                    </Button>
                                    <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleAddRelative}>
                                        <UserPlus className="w-4 h-4" />
                                        {t('Add Relative', 'रिश्तेदार जोड़ें')}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                            {isOwnProfile && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/settings/profile">{t('Edit Profile', 'प्रोफ़ाइल संपादित करें')}</Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center md:justify-start gap-8 text-sm md:text-base border-y md:border-none py-4 md:py-0 border-border/40">
                            <button onClick={() => setActiveTab('posts')} className="flex md:gap-1 hover:opacity-70 transition-opacity">
                                <span className="font-semibold">{postsCount}</span> {t('posts', 'पोस्ट')}
                            </button>
                            <button onClick={() => setActiveTab('family')} className="flex md:gap-1 hover:opacity-70 transition-opacity">
                                <span className="font-semibold">{treeData?.members?.length || 0}</span> {t('relatives', 'रिश्तेदार')}
                            </button>
                            <div className="flex md:gap-1"><span className="font-semibold">{member.generation_level || 0}</span> {t('gen', 'पीढ़ी')}</div>
                        </div>

                        {/* Bio / Name / Details */}
                        <div className="space-y-1 text-sm md:text-base">
                            <div className="font-semibold">
                                {member.full_name}
                                {member.full_name_hi && <span className="font-normal text-muted-foreground ml-1">({member.full_name_hi})</span>}
                            </div>
                            {/* Vanshmala ID */}
                            {vanshmalaId && (
                                <button
                                    onClick={() => { navigator.clipboard.writeText(vanshmalaId); toast.success('Vanshmala ID copied!'); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full hover:bg-muted transition-colors"
                                >
                                    <span className="font-semibold text-foreground/70">{vanshmalaId}</span>
                                    <Copy className="w-3 h-3" />
                                </button>
                            )}
                            {kinship && (
                                <div className="text-saffron font-medium text-sm bg-saffron/10 inline-block px-3 py-1 rounded-full mt-1 mb-1">
                                    {kinship.relationText === 'You' ? t("This is your profile", "यह आपकी प्रोफ़ाइल है") : `${t("Your", "आपके")} ${kinship.relationText}`}
                                </div>
                            )}
                            {isFieldVisible('bio') && member.bio && (
                                <p className="whitespace-pre-wrap">{member.bio}</p>
                            )}

                            <div className="text-muted-foreground flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-2">
                                {isFieldVisible('mool_niwas') && member.mool_niwas && (
                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-500 font-medium">
                                        <Landmark className="w-3 h-3" /> {member.mool_niwas}
                                    </div>
                                )}
                                {(member.kuldevi || member.kuldevta) && (
                                    <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-medium">
                                        <Sparkles className="w-3 h-3" /> {member.kuldevi} {member.kuldevi && member.kuldevta && '&'} {member.kuldevta}
                                    </div>
                                )}
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-transparent border-t rounded-none h-12 p-0">
                        {['about', 'posts', 'journey', 'family'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none bg-transparent"
                            >
                                <span className="uppercase text-xs tracking-widest font-semibold flex items-center gap-1.5">
                                    {tab === 'about' && <><User className="w-3 h-3" /> <span className="hidden md:inline">{t('ABOUT', 'परिचय')}</span></>}
                                    {tab === 'posts' && <><MessageCircle className="w-3 h-3" /> <span className="hidden md:inline">{t('POSTS', 'पोस्ट')}</span></>}
                                    {tab === 'journey' && <><Sparkles className="w-3 h-3" /> <span className="hidden md:inline">{t('JOURNEY', 'यात्रा')}</span></>}
                                    {tab === 'family' && <><Heart className="w-3 h-3" /> <span className="hidden md:inline">{t('FAMILY', 'परिवार')}</span></>}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-8 min-h-[300px]">
                        <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                        <TabsContent value="posts" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {feedPosts && feedPosts.length > 0 ? (
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    {feedPosts.map((post: any) => (
                                        <FeedItem key={post.id} post={{ ...post, profiles: { full_name: member.full_name, avatar_url: member.avatar_url } }} onPostChange={() => refetchPosts()} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground">{t('No public posts yet.', 'अभी तक कोई सार्वजनिक पोस्ट नहीं।')}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="journey" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LifeJourneyPublicView memberId={member.id} member={member} privacy={privacy} />
                        </TabsContent>

                        <TabsContent value="family" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {treeData?.members && treeData.members.length > 1 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {treeData.members
                                        .filter((m: any) => m.id !== member.id)
                                        .slice(0, 12)
                                        .map((relative: any) => (
                                            <Link
                                                key={relative.id}
                                                to={relative.username ? `/${relative.username}` : '#'}
                                                className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow text-center"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                    {relative.avatar_url ? (
                                                        <img src={relative.avatar_url} alt={relative.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium truncate w-full">{relative.full_name}</span>
                                                {relative.full_name_hi && <span className="text-xs text-muted-foreground truncate w-full">{relative.full_name_hi}</span>}
                                            </Link>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground">{t('No family members visible.', 'कोई परिवार के सदस्य दिखाई नहीं दे रहे।')}</p>
                                </div>
                            )}
                            {member.tree_id && (
                                <div className="text-center mt-6">
                                    <Button variant="outline" asChild>
                                        <Link to={`/tree/${member.tree_id}`}>{t('View Full Family Tree', 'पूर्ण वंशवृक्ष देखें')}</Link>
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
            <Footer />
            {member && (
                <AddRelativeDialog
                    isOpen={showAddRelative}
                    onClose={() => setShowAddRelative(false)}
                    targetMember={{
                        id: member.id,
                        full_name: member.full_name,
                        tree_id: member.tree_id,
                        user_id: member.user_id,
                    }}
                />
            )}
        </div>
    );
};

export default PublicProfile;
