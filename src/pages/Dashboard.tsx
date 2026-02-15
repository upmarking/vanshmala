import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { FeedPost } from '@/components/dashboard/FeedPost';

interface FamilyTreeRecord {
  id: string;
  family_name: string;
  family_id: string;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);

  // Onboarding States
  const [creating, setCreating] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeGotra, setNewTreeGotra] = useState('');
  const [joinFamilyId, setJoinFamilyId] = useState('');
  const [primaryTreeId, setPrimaryTreeId] = useState<string | null>(null);

  useEffect(() => {
    checkFamilyStatus();
  }, [user]);

  const checkFamilyStatus = async () => {
    if (!user) return;
    setLoading(true);

    // Check if user is member of any tree
    const { count, error } = await supabase
      .from('tree_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count > 0) {
      setHasFamily(true);
      fetchFeed();
    } else {
      setHasFamily(false);
      setLoading(false);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // 1. Get my tree IDs
      const { data: memberships } = await supabase
        .from('tree_memberships')
        .select('tree_id')
        .eq('user_id', user!.id);

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      };

      const treeIds = memberships.map(m => m.tree_id);
      if (treeIds.length > 0) setPrimaryTreeId(treeIds[0]);

      // 2. Get members of these trees (to link events to people)
      const { data: members } = await supabase
        .from('family_members')
        .select('id, full_name, avatar_url, tree_id')
        .in('tree_id', treeIds);

      const memberMap = new Map(members?.map(m => [m.id, m]));

      // 3. Fetch Timeline Events for these members
      const memberIds = members?.map(m => m.id) || [];

      if (memberIds.length === 0) {
        setFeedEvents([]);
        setLoading(false);
        return;
      }

      const { data: events, error } = await supabase
        .from('timeline_events')
        .select('*')
        .in('family_member_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(50); // Pagination later

      if (error) throw error;

      // Combine event with member data
      const combined = events?.map(event => ({
        ...event,
        member: memberMap.get(event.family_member_id)
      })) || [];

      setFeedEvents(combined);

    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);

    try {
      // Check existing creation
      const { count, error: countError } = await supabase
        .from('family_trees')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user!.id);

      if (countError) throw countError;
      if (count && count >= 1) {
        toast.error(t('You can only create one VanshMala family.', 'आप केवल एक वंशमाला परिवार बना सकते हैं।'));
        return;
      }

      const { data: treeData, error } = await supabase
        .from('family_trees')
        .insert({
          family_name: newTreeName.trim(),
          gotra: newTreeGotra.trim() || null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (treeData) {
        // Add creator as member
        const { data: memberData, error: memberError } = await supabase
          .from('family_members')
          .insert({
            tree_id: treeData.id,
            full_name: profile?.full_name || user!.email?.split('@')[0] || 'Admin',
            gender: profile?.gender as "male" | "female" | "other" | null,
            user_id: user!.id,
            is_alive: true,
            generation_level: 1,
            gotra: newTreeGotra.trim() || profile?.gotra || null
          } as any)
          .select()
          .single();

        if (memberError) {
          toast.error("Tree created but failed to join automatically. Please contact support.");
        } else {
          await supabase.from('tree_memberships').insert({
            tree_id: treeData.id,
            user_id: user!.id,
            member_id: memberData.id,
            role: 'admin'
          });
        }
        toast.success(t('Family tree created!', 'कुलवृक्ष बन गया!'));
        checkFamilyStatus(); // Refresh to show Feed
      }

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinFamilyId.trim()) return;
    setCreating(true);

    try {
      // Find tree
      const { data: tree, error: findError } = await supabase
        .from('family_trees')
        .select('id')
        .eq('family_id', joinFamilyId.trim())
        .single();

      if (findError || !tree) {
        toast.error(t('Family not found. Check the Family ID.', 'परिवार नहीं मिला। परिवार ID जांचें।'));
        return;
      }

      // Check existing membership
      const { data: existing } = await supabase
        .from('tree_memberships')
        .select('id')
        .eq('tree_id', tree.id)
        .eq('user_id', user!.id)
        .single();

      if (existing) {
        toast.error(t('You are already a member of this family.', 'आप पहले से इस परिवार के सदस्य हैं।'));
        return;
      }

      // Join (Request logic might be better, but sticking to direct join for now as per prev code)
      // Note: The previous code just inserted into tree_memberships. 
      // Realistically this should create a "Pending Request". 
      // IMPORTANT: For now, I will keep the direct join but likely we need a 'Join Request' flow.
      // Given "Merge Request" logic exists, maybe this should be similar. 
      // However, I will follow the previous implementation for direct join but alert if it fails.

      const { error } = await supabase
        .from('tree_memberships')
        .insert({
          tree_id: tree.id,
          user_id: user!.id,
          role: 'member', // Default role
        });

      if (error) throw error;

      toast.success(t('Joined family successfully!', 'परिवार से सफलतापूर्वक जुड़ गए!'));
      checkFamilyStatus();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-saffron" />
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: NO FAMILY (ONBOARDING)
  // ----------------------------------------------------------------------
  if (!hasFamily) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-display font-bold text-saffron-900 mb-4">
            {t('Welcome to VanshMala', 'वंशमाला में आपका स्वागत है')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              'To get started, create a new family tree or join an existing one using a Family ID.',
              'शुरू करने के लिए, एक नया कुलवृक्ष बनाएं या परिवार आईडी का उपयोग करके मौजूदा में शामिल हों।'
            )}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* CREATE CARD */}
          <Card className="hover:shadow-lg transition-shadow border-saffron/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-saffron" />
                {t('Start a New Family', 'नया परिवार शुरू करें')}
              </CardTitle>
              <CardDescription>
                {t('Create a new VanshMala for your family lineage.', 'अपने वंश के लिए नई वंशमाला बनाएं।')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTree} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('Family Name', 'परिवार का नाम')}</label>
                  <Input
                    placeholder="e.g. Sharma Parivar"
                    value={newTreeName}
                    onChange={e => setNewTreeName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('Gotra', 'गोत्र')} <span className="text-xs text-muted-foreground">(Optional)</span></label>
                  <Input
                    placeholder="e.g. Bharadwaj"
                    value={newTreeGotra}
                    onChange={e => setNewTreeGotra(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-saffron hover:opacity-90" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Create Family', 'परिवार बनाएं')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* JOIN CARD */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {t('Join Existing', 'मौजूदा से जुड़ें')}
              </CardTitle>
              <CardDescription>
                {t('Enter Family ID shared by your relative.', 'अपने रिश्तेदार द्वारा साझा की गई परिवार आईडी दर्ज करें।')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinTree} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('Family ID', 'परिवार ID')}</label>
                  <Input
                    placeholder="e.g. FAM-123xyz"
                    value={joinFamilyId}
                    onChange={e => setJoinFamilyId(e.target.value)}
                    required
                  />
                </div>
                <div className="h-[72px] flex items-end"> {/* Spacer to align buttons */}
                  <Button type="submit" variant="outline" className="w-full border-blue-200 hover:bg-blue-50 text-blue-700" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Join Family', 'परिवार से जुड़ें')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: FAMILY FEED
  // ----------------------------------------------------------------------
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 flex gap-8">
      {/* Main Feed Column */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display">{t('Family Feed', 'पारिवारिक फ़ीड')}</h1>
          <p className="text-muted-foreground text-sm">{t('Latest updates from your family timeline.', 'आपके परिवार की समयरेखा से नवीनतम अपडेट।')}</p>
        </div>

        {feedEvents.length === 0 ? (
          <Card className="text-center py-12 bg-muted/30 border-dashed">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t('No updates yet', 'अभी कोई अपडेट नहीं')}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {t('Timeline events added by your family members will appear here.', 'आपके परिवार के सदस्यों द्वारा जोड़े गए समयरेखा ईवेंट यहां दिखाई देंगे।')}
              </p>
              <Button onClick={() => navigate(primaryTreeId ? '/tree/' + primaryTreeId : '/tree')} variant="link" className="text-saffron">
                {t('Go to Family Tree', 'कुलवृक्ष पर जाएं')}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {feedEvents.map((event) => (
              <FeedPost key={event.id} event={event} member={event.member} />
            ))}

            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("You're all caught up!", "आप सभी अपडेट देख चुके हैं!")}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar (Desktop Only) - Could contain suggestions, upcoming birthdays etc. */}
      <div className="hidden lg:block w-80 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('Quick Actions', 'त्वरित कार्रवाई')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" onClick={() => navigate(primaryTreeId ? '/tree/' + primaryTreeId : '/tree')}>
              <Users className="mr-2 h-4 w-4" />
              {t('View Family Tree', 'कुलवृक्ष देखें')}
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/vault')}>
              <Loader2 className="mr-2 h-4 w-4" /> {/* Placeholder icon */}
              {t('Open Legacy Vault', 'विरासत तिजोरी खोलें')}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-saffron/10 to-transparent border-none">
          <CardContent className="pt-6">
            <h4 className="font-display font-bold text-saffron-900 mb-2">{t(' Invite Family', 'परिवार को आमंत्रित करें')}</h4>
            <p className="text-xs text-muted-foreground mb-4">
              {t('Grow your tree by inviting relatives.', 'रिश्तेदारों को आमंत्रित करके अपने पेड़ को बढ़ाएं।')}
            </p>
            <Button size="sm" className="w-full bg-saffron text-white hover:bg-saffron-600">
              {t('Invite Now', 'अभी आमंत्रित करें')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

