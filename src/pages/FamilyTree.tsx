import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Plus, GitMerge } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTree, useTreeMembers, useIsTreeAdmin } from '@/hooks/useFamilyTree';
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
  added_by: null
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

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string, name: string } | undefined>(undefined);
  const [relationType, setRelationType] = useState<RelationshipType | undefined>(undefined);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfileMember, setSelectedProfileMember] = useState<FamilyTreeNode | null>(null);

  const [mergeListOpen, setMergeListOpen] = useState(false);

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

      // 4. Sons
      const s1 = createDummyMember('s1', 'Eldest Son', 'बड़ा बेटा', 4, 'male');
      const s2 = createDummyMember('s2', 'Middle Son', 'मंझला बेटा', 4, 'male');
      const s3 = createDummyMember('s3', 'Youngest Son', 'छोटा बेटा', 4, 'male');

      // Linking Generations
      // Great Grand -> Grand
      ggf.children = [gf];

      // Grand -> Father
      gf.children = [f];

      // Father -> Sons
      f.children = [s1, s2, s3];

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 relative">
            {/* Merge Requests Button (Admin only ideally, but visible for now) */}
            {treeId && (
              <div className="absolute top-0 right-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(`/tree/${treeId}/documents`)}
                >
                  <span className="hidden sm:inline">{t('Documents', 'दस्तावेज़')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(`/tree/${treeId}/tags`)}
                >
                  <span className="hidden sm:inline">{t('Tags', 'टैग')}</span>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setMergeListOpen(true)}
                  >
                    <GitMerge className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('Merge Requests', 'विलय अनुरोध')}</span>
                    {mergeRequests && mergeRequests.length > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                        {mergeRequests.length}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>
            )}

            <span className="text-saffron/40 text-2xl block mb-2">🕉</span>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
              </div>
            ) : (tree || !treeId) ? (
              <>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
                  {treeId ? tree?.family_name : t('Sample Family Tree', 'उदाहरण वंशवृक्ष')}
                </h1>
                <p className="font-body text-muted-foreground text-lg">
                  {treeId ? (tree?.description || t('Family Tree', 'वंशवृक्ष')) : t('This is a sample view of how a family tree looks.', 'यह एक उदाहरण है कि वंशवृक्ष कैसा दिखता है।')}
                </p>
              </>
            ) : (
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
                {t('Tree Not Found', 'वंशवृक्ष नहीं मिला')}
              </h1>
            )}
          </div>

          <div className="overflow-x-auto pb-8 min-h-[400px]">
            <div className="flex justify-center min-w-[700px]">
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

          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-saffron/20 text-muted-foreground hover:border-saffron hover:text-saffron transition-colors font-body h-auto"
              onClick={handleAddMemberGeneric}
            >
              <Plus className="w-5 h-5" />
              {t('Add Member', 'सदस्य जोड़ें')}
            </Button>
          </div>
        </div>
      </div>
      <Footer />

      {treeId && (
        <>
          <AddMemberDialog
            isOpen={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
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
