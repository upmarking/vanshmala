import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { TreePine, Users, Plus, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FamilyTreeRecord {
  id: string;
  family_name: string;
  family_name_hi: string | null;
  family_id: string;
  gotra: string | null;
  kuldevi: string | null;
  description: string | null;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [trees, setTrees] = useState<FamilyTreeRecord[]>([]);
  const [loadingTrees, setLoadingTrees] = useState(true);
  const [showCreateTree, setShowCreateTree] = useState(false);
  const [showJoinTree, setShowJoinTree] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeGotra, setNewTreeGotra] = useState('');
  const [joinFamilyId, setJoinFamilyId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTrees();
  }, [user]);

  const fetchTrees = async () => {
    if (!user) return;
    setLoadingTrees(true);
    const { data, error } = await supabase
      .from('family_trees')
      .select('id, family_name, family_name_hi, family_id, gotra, kuldevi, description');

    if (!error && data) {
      setTrees(data as FamilyTreeRecord[]);
    }
    setLoadingTrees(false);
  };

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('family_trees')
      .insert({
        family_name: newTreeName.trim(),
        gotra: newTreeGotra.trim() || null,
        created_by: user!.id,
      })
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Family tree created!', 'कुलवृक्ष बन गया!'));
      setShowCreateTree(false);
      setNewTreeName('');
      setNewTreeGotra('');
      fetchTrees();
    }
  };

  const handleJoinTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinFamilyId.trim()) return;
    setCreating(true);

    // Find tree by family_id
    const { data: tree, error: findError } = await supabase
      .from('family_trees')
      .select('id')
      .eq('family_id', joinFamilyId.trim())
      .single();

    if (findError || !tree) {
      toast.error(t('Family not found. Check the Family ID.', 'परिवार नहीं मिला। परिवार ID जांचें।'));
      setCreating(false);
      return;
    }

    const { error } = await supabase
      .from('tree_memberships')
      .insert({
        tree_id: tree.id,
        user_id: user!.id,
        role: 'member',
      });

    setCreating(false);
    if (error) {
      if (error.code === '23505') {
        toast.error(t('You are already a member of this family.', 'आप पहले से इस परिवार के सदस्य हैं।'));
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t('Joined family successfully!', 'परिवार से सफलतापूर्वक जुड़ गए!'));
      setShowJoinTree(false);
      setJoinFamilyId('');
      fetchTrees();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {t('Namaste', 'नमस्ते')}, {profile?.full_name || user?.email} 🙏
                </h1>
                <p className="font-body text-muted-foreground mt-1">
                  {t('Vanshmala ID: ', 'वंशमाला ID: ')}
                  <span className="text-saffron font-semibold">{profile?.vanshmala_id}</span>
                  {profile?.gotra && (
                    <span className="ml-3 text-gold-dark">
                      {t('Gotra: ', 'गोत्र: ')}{profile.gotra}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings/profile')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent/10 transition-colors font-body text-sm"
              >
                <Settings className="w-4 h-4" />
                {t('Settings', 'सेटिंग्स')}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors font-body text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t('Sign Out', 'साइन आउट')}
              </button>
            </div>
          </motion.div>

          {/* Trees Section */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              {t('Your Family Trees', 'आपके कुलवृक्ष')}
            </h2>

            {loadingTrees ? (
              <div className="text-center py-12">
                <span className="text-saffron/40 text-2xl animate-pulse">ॐ</span>
              </div>
            ) : trees.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trees.map((tree) => (
                  <motion.div
                    key={tree.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-saffron/30 transition-all cursor-pointer shadow-soft"
                    onClick={() => navigate(`/tree/${tree.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0">
                        <TreePine className="w-5 h-5 text-saffron" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-foreground truncate">
                          {tree.family_name}
                        </h3>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          {t('Family ID: ', 'परिवार ID: ')}{tree.family_id}
                        </p>
                        {tree.gotra && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark text-[10px] font-medium">
                            {t('Gotra: ', 'गोत्र: ')}{tree.gotra}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
                <span className="text-saffron/30 text-3xl block mb-3">🕉</span>
                <p className="font-body text-muted-foreground mb-4">
                  {t('No family trees yet. Create one or join an existing family!', 'अभी तक कोई कुलवृक्ष नहीं। एक बनाएं या मौजूदा परिवार से जुड़ें!')}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowCreateTree(true); setShowJoinTree(false); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron"
            >
              <Plus className="w-4 h-4" />
              {t('Create New Vanshmala', 'नई वंशमाला बनाएं')}
            </button>
            <button
              onClick={() => { setShowJoinTree(true); setShowCreateTree(false); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border hover:border-gold/40 font-medium font-body transition-colors"
            >
              <Users className="w-4 h-4" />
              {t('Join Existing Family', 'मौजूदा परिवार से जुड़ें')}
            </button>
          </div>

          {/* Create Tree Modal */}
          {showCreateTree && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md">
              <form onSubmit={handleCreateTree} className="p-6 rounded-2xl bg-card border border-border shadow-elevated space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {t('Create New Family Tree', 'नया कुलवृक्ष बनाएं')}
                </h3>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Family Name', 'परिवार का नाम')} *
                  </label>
                  <input
                    type="text"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    placeholder={t('e.g., Sharma Parivar', 'जैसे, शर्मा परिवार')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
                    required
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Gotra (Optional)', 'गोत्र (वैकल्पिक)')}
                  </label>
                  <input
                    type="text"
                    value={newTreeGotra}
                    onChange={(e) => setNewTreeGotra(e.target.value)}
                    placeholder={t('Family gotra', 'पारिवारिक गोत्र')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
                  >
                    {creating ? t('Creating...', 'बना रहे हैं...') : t('Create', 'बनाएं')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTree(false)}
                    className="px-5 py-2.5 rounded-xl border border-border font-body text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('Cancel', 'रद्द करें')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Join Tree Modal */}
          {showJoinTree && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md">
              <form onSubmit={handleJoinTree} className="p-6 rounded-2xl bg-card border border-border shadow-elevated space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {t('Join Existing Family', 'मौजूदा परिवार से जुड़ें')}
                </h3>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Family ID', 'परिवार ID')} *
                  </label>
                  <input
                    type="text"
                    value={joinFamilyId}
                    onChange={(e) => setJoinFamilyId(e.target.value)}
                    placeholder={t('e.g., FAM-a1b2c3d4', 'जैसे, FAM-a1b2c3d4')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
                  >
                    {creating ? t('Joining...', 'जुड़ रहे हैं...') : t('Join', 'जुड़ें')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinTree(false)}
                    className="px-5 py-2.5 rounded-xl border border-border font-body text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('Cancel', 'रद्द करें')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
