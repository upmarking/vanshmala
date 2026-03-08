import { useLanguage } from '@/contexts/LanguageContext';

import { Plus, GitMerge, FileText, Tag as TagIcon, Gift, Copy, Check } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTree, useTreeMembers, useIsTreeAdmin, useUserTrees } from '@/hooks/useFamilyTree';
import { buildFamilyTree, FamilyTreeNode } from '@/utils/familyTreeUtils';
import { TreeNode } from '@/components/family-tree/TreeNode';
import { Button } from '@/components/ui/button';
import { AddMemberDialog } from '@/components/family-tree/AddMemberDialog';
import { MemberProfileDialog } from '@/components/family-tree/MemberProfileDialog';
import { MergeRequestListDialog } from '@/components/family-tree/MergeRequestListDialog';
import { Database } from "@/integrations/supabase/types";
import { useMergeRequests } from '@/hooks/useMergeRequests';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

type RelationshipType = Database['public']['Enums']['relationship_type'];

const createDummyMember = (id: string, name: string, nameHi: string, gen: number, gender: 'male' | 'female' = 'male'): FamilyTreeNode => ({
  id,
  tree_id: 'demo',
  full_name: name,
  full_name_hi: nameHi,
  gender,
  generation_level: gen,
  vanshmala_id: `DEMO-${id}`,
  user_id: null,
  is_alive: true,
  date_of_birth: null,
  date_of_death: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  username: null,
  phone: null,
  bio: null,
  avatar_url: null,
  children: [],
  parents: [],
  siblings: [],
  spouse: undefined,
  gotra: null,
  place_of_birth: null,
  blood_group: null,
  marriage_date: null,
  education: null,
  career: null,
  achievements: null,
  awards: null,
  migration_info: null,
  privacy_settings: null,
  added_by: null,
  kuldevi: null,
  kuldevta: null,
  mool_niwas: null,
  email: null,
});

const FamilyTree = () => {
  const { t } = useLanguage();
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();

  // Only fetch if treeId is present
  const { data: tree, isLoading: treeLoading } = useTree(treeId || '');
  const { data: treeData, isLoading: membersLoading } = useTreeMembers(treeId || '');
  const { requests: mergeRequests } = useMergeRequests(treeId || '');

  // Check admin status
  const { user } = useAuth();
  const { data: isAdmin } = useIsTreeAdmin(treeId || '', user?.id);

  // Auto-redirect for logged-in users if no treeId is provided
  const { data: userTrees, isLoading: userTreesLoading } = useUserTrees(user?.id);

  useEffect(() => {
    if (!treeId && user && userTrees && userTrees.length > 0) {
      // Redirect to the first tree found
      // @ts-ignore
      const firstTreeId = userTrees[0].tree_id;
      if (firstTreeId) {
        navigate(`/tree/${firstTreeId}`, { replace: true });
      }
    }
  }, [treeId, user, userTrees, navigate]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string, name: string } | undefined>(undefined);
  const [relationType, setRelationType] = useState<RelationshipType | undefined>(undefined);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfileMember, setSelectedProfileMember] = useState<FamilyTreeNode | null>(null);

  const [mergeListOpen, setMergeListOpen] = useState(false);
  const [copiedFamilyId, setCopiedFamilyId] = useState(false);

  const handleCopyFamilyId = () => {
    if (!tree?.family_id) return;
    navigator.clipboard.writeText(tree.family_id);
    setCopiedFamilyId(true);
    setTimeout(() => setCopiedFamilyId(false), 2000);
  };

  const rootNode = useMemo(() => {
    if (!treeId) {
      // Hardcoded Demo Tree
      // 1. Great Grandparents
      const ggf = createDummyMember('ggf', 'Great Grandfather', 'परदादा', 1, 'male');
      const ggm = createDummyMember('ggm', 'Great Grandmother', 'परदादी', 1, 'female');

      // Link spouses
      ggf.spouse = ggm;
      ggm.spouse = ggf; // Note: In a real graph, checking circular refs is important for serialization but fine for object refs if handled

      // 2. Grandparents
      const gf = createDummyMember('gf', 'Grandfather', 'दादा', 2, 'male');
      const gm = createDummyMember('gm', 'Grandmother', 'दादी', 2, 'female');

      gf.spouse = gm;
      gm.spouse = gf;

      // 3. Parents
      const f = createDummyMember('f', 'Father', 'पिता', 3, 'male');
      const m = createDummyMember('m', 'Mother', 'माँ', 3, 'female');

      f.spouse = m;
      m.spouse = f;

      // 4. Sons + daughter-in-law
      const s1 = createDummyMember('s1', 'Eldest Son', 'बड़ा बेटा', 4, 'male');
      const s1w = createDummyMember('s1w', 'Eldest Daughter-in-law', 'बड़ी बहू', 4, 'female');
      const s2 = createDummyMember('s2', 'Middle Son', 'मंझला बेटा', 4, 'male');
      const s3 = createDummyMember('s3', 'Youngest Son', 'छोटा बेटा', 4, 'male');

      // 5. Grandchild
      const gc = createDummyMember('gc', 'Grandchild', 'पोता', 5, 'male');

      // Spouse links
      s1.spouse = s1w;
      s1w.spouse = s1;

      // Linking Generations
      // Great Grand -> Grand
      ggf.children = [gf];

      // Grand -> Father
      gf.children = [f];

      // Father -> Sons
      f.children = [s1, s2, s3];

      // Eldest Son -> Grandchild
      s1.children = [gc];

      return ggf;
    }

    if (treeData?.members) {
      return buildFamilyTree(treeData.members, treeData.relationships || []);
    }
    return null;
  }, [treeData, treeId]);

  const isLoading = treeId ? (treeLoading || membersLoading) : false;

  const handleAddRelative = (memberId: string, type: RelationshipType, name: string) => {
    if (!treeId) {
      toast.info(t("This is a demo tree. Sign in to create your own!", "यह एक डेमो वंशवृक्ष है। अपना खुद का बनाने के लिए साइन इन करें!"));
      navigate('/login');
      return;
    }
    setSelectedMember({ id: memberId, name });
    setRelationType(type);
    setAddDialogOpen(true);
  };

  const handleViewProfile = (member: FamilyTreeNode) => {
    if (!treeId) {
      // Optional: Allow viewing profile with dummy data? 
      // For now, let's treat it as read-only or show same toast
      // Or we can open the dialog with read-only mode if we want.
      // The prompt says "Simple HardCoded Family Tree ... (This isn't linked to backend)".
      // User likely just wants to see the visual.
      toast.info(t("Sign in to view full detailed profiles.", "विस्तृत प्रोफ़ाइल देखने के लिए साइन इन करें।"));
      return;
    }
    setSelectedProfileMember(member);
    setProfileDialogOpen(true);
  };

  const handleAddMemberGeneric = () => {
    if (!treeId) {
      toast.info(t("Sign in to create your own family tree!", "अपना खुद का वंशवृक्ष बनाने के लिए साइन इन करें!"));
      navigate('/login');
      return;
    }
    setSelectedMember(undefined);
    setRelationType(undefined);
    setAddDialogOpen(true);
  };

  return (
    <div className="bg-background">
      <div className="py-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 relative">
            {/* Merge Requests Button (Admin only ideally, but visible for now) */}
            {/* Quick Action Buttons */}
            {treeId && (
              <div className="flex flex-wrap justify-center sm:justify-end gap-2 mb-6 sm:absolute sm:top-0 sm:right-0 sm:mb-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm"
                  onClick={() => navigate(`/tree/${treeId}/documents`)}
                >
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span className="hidden sm:inline">{t('Documents', 'दस्तावेज़')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm"
                  onClick={() => navigate(`/tree/${treeId}/tags`)}
                >
                  <TagIcon className="w-4 h-4 text-orange-600" />
                  <span className="hidden sm:inline">{t('Tags', 'टैग')}</span>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm"
                    onClick={() => setMergeListOpen(true)}
                  >
                    <GitMerge className="w-4 h-4 text-orange-600" />
                    <span className="hidden sm:inline">{t('Merge Requests', 'विलय अनुरोध')}</span>
                    {mergeRequests && mergeRequests.length > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] animate-pulse">
                        {mergeRequests.length}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>
            )}

            <span className="text-saffron/40 text-2xl block mb-2">🕉</span>

            {isLoading || userTreesLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
              </div>
            ) : (tree || !treeId) ? (
              <>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
                  {treeId ? tree?.family_name : user ? t('Your Family Tree', 'आपका कुलवृक्ष') : t('Sample Family Tree', 'उदाहरण वंशवृक्ष')}
                </h1>
                <p className="font-body text-muted-foreground text-lg">
                  {treeId ? (tree?.description || t('Family Tree', 'वंशवृक्ष')) :
                    user ?
                      (userTrees && userTrees.length === 0 ? t('You are not part of any family tree yet.', 'आप अभी तक किसी भी कुलवृक्ष का हिस्सा नहीं हैं।') : t('Loading your tree...', 'आपका कुलवृक्ष लोड हो रहा है...'))
                      : t('This is a sample view of how a family tree looks.', 'यह एक उदाहरण है कि वंशवृक्ष कैसा दिखता है।')}
                </p>

                {/* Family ID badge — visible when on a real tree */}
                {treeId && tree?.family_id && user && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-full px-3 py-1.5">
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      {t('Family ID', 'परिवार ID')}: <span className="font-mono font-bold tracking-wide">{tree.family_id}</span>
                    </span>
                    <button
                      onClick={handleCopyFamilyId}
                      className="p-0.5 rounded-full hover:bg-amber-200/60 transition-colors"
                      title={t('Copy to share with family', 'परिवार के साथ शेयर करने के लिए कॉपी करें')}
                    >
                      {copiedFamilyId
                        ? <Check className="w-3 h-3 text-green-600" />
                        : <Copy className="w-3 h-3 text-amber-600" />
                      }
                    </button>
                  </div>
                )}

                {user && !treeId && userTrees && userTrees.length === 0 && (
                  <div className="mt-6">
                    <Button onClick={() => navigate('/dashboard')} className="bg-gradient-saffron text-white">
                      {t('Create or Join Family', 'परिवार बनाएं या शामिल हों')}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
                {t('Tree Not Found', 'वंशवृक्ष नहीं मिला')}
              </h1>
            )}
          </div>

          <div className="pb-8 min-h-[400px] overflow-x-auto">
            <div className="inline-flex min-w-full justify-center px-4 py-2">
              {isLoading ? (
                <div className="text-muted-foreground">{t('Loading tree...', 'वंशवृक्ष लोड हो रहा है...')}</div>
              ) : rootNode ? (
                <TreeNode member={rootNode} onAddRelative={handleAddRelative} onViewProfile={handleViewProfile} />
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {t('This family tree is empty. Start by adding the first member.', 'यह वंशवृक्ष खाली है। पहला सदस्य जोड़कर शुरुआत करें।')}
                  </p>
                </div>
              )}
            </div>
          </div>


          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-saffron/20 text-muted-foreground hover:border-saffron hover:text-saffron transition-colors font-body h-auto"
              onClick={handleAddMemberGeneric}
            >
              <Plus className="w-5 h-5" />
              {t('Add Member', 'सदस्य जोड़ें')}
            </Button>

            <Button
              className="w-full sm:w-auto flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-saffron text-white hover:opacity-90 shadow-lg shadow-saffron/20 transition-all font-bold h-auto border-none"
              onClick={() => navigate('/refer')}
            >
              <Gift className="w-5 h-5" />
              {t('Invite Family', 'परिवार को आमंत्रित करें')}
            </Button>
          </div>
        </div>
      </div>

      {treeId && (
        <>
          <AddMemberDialog
            isOpen={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            onSuccess={(newMember) => {
              setAddDialogOpen(false);
              setSelectedProfileMember(newMember as any);
              setProfileDialogOpen(true);
            }}
            treeId={treeId}
            relativeId={selectedMember?.id}
            relationType={relationType}
            relativeName={selectedMember?.name}
          />

          <MemberProfileDialog
            isOpen={profileDialogOpen}
            onClose={() => setProfileDialogOpen(false)}
            member={selectedProfileMember}
            treeId={treeId}
          />

          <MergeRequestListDialog
            isOpen={mergeListOpen}
            onClose={() => setMergeListOpen(false)}
            treeId={treeId}
          />
        </>
      )}
    </div>
  );
};

export default FamilyTree;
