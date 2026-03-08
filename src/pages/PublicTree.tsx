import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { buildFamilyTree, FamilyTreeNode } from '@/utils/familyTreeUtils';
import { TreeNode } from '@/components/family-tree/TreeNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, UserPlus, TreesIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

const PublicTree = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tree, setTree] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ full_name: '', relationship_claim: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchTree = async () => {
      setIsLoading(true);
      const { data: treeData, error: treeError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('public_share_token', token)
        .single();

      if (treeError || !treeData) {
        setIsLoading(false);
        return;
      }
      setTree(treeData);

      const [membersRes, relsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('tree_id', treeData.id),
        supabase.from('family_relationships').select('*').eq('tree_id', treeData.id),
      ]);

      setMembers(membersRes.data || []);
      setRelationships(relsRes.data || []);
      setIsLoading(false);
    };
    fetchTree();
  }, [token]);

  const rootNode = useMemo(() => {
    if (members.length === 0) return null;
    return buildFamilyTree(members, relationships);
  }, [members, relationships]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: tree?.family_name || 'Family Tree', url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(t('Link copied!', 'लिंक कॉपी हो गया!'));
    }
  };

  const handleRequestLink = async () => {
    if (!user) {
      toast.info(t('Please sign in to request linking.', 'लिंक अनुरोध करने के लिए साइन इन करें।'));
      navigate('/login');
      return;
    }
    if (!linkForm.full_name.trim()) {
      toast.error(t('Please enter your name', 'कृपया अपना नाम दर्ज करें'));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('tree_link_requests').insert({
      tree_id: tree.id,
      requester_user_id: user.id,
      full_name: linkForm.full_name.trim(),
      relationship_claim: linkForm.relationship_claim.trim() || null,
    });

    if (error) {
      toast.error(t('Failed to submit request', 'अनुरोध सबमिट नहीं हो सका'));
    } else {
      toast.success(t('Link request submitted! The family admin will review it.', 'लिंक अनुरोध सबमिट हो गया! परिवार का एडमिन इसकी समीक्षा करेगा।'));
      setLinkDialogOpen(false);
    }
    setSubmitting(false);
  };

  const handleViewProfile = (member: FamilyTreeNode) => {
    // Read-only, no action on public view
  };

  const handleAddRelative = () => {
    toast.info(t('This is a read-only view. Request to join this family tree!', 'यह केवल देखने के लिए है। इस वंशवृक्ष से जुड़ने का अनुरोध करें!'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <TreesIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('Tree Not Found', 'वंशवृक्ष नहीं मिला')}
          </h1>
          <p className="text-muted-foreground">
            {t('This share link is invalid or has been revoked.', 'यह शेयर लिंक अमान्य है या रद्द कर दिया गया है।')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${tree.family_name} - Family Tree | VanshMala`}
        description={`View the ${tree.family_name} family tree on VanshMala`}
      />

      <div className="py-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-primary/40 text-2xl block mb-2">🕉</span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-2">
              {tree.family_name}
            </h1>
            {tree.family_name_hi && (
              <p className="text-xl text-muted-foreground">{tree.family_name_hi}</p>
            )}
            <p className="text-muted-foreground mt-2">
              {t(`${members.length} members`, `${members.length} सदस्य`)}
              {tree.gotra && ` • ${t('Gotra', 'गोत्र')}: ${tree.gotra}`}
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                {t('Share', 'शेयर करें')}
              </Button>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={() => setLinkDialogOpen(true)}>
                <UserPlus className="w-4 h-4" />
                {t('Request to Join', 'जुड़ने का अनुरोध करें')}
              </Button>
            </div>
          </div>

          {/* Tree View */}
          <div className="pb-8 min-h-[400px] overflow-x-auto">
            <div className="inline-flex min-w-full justify-center px-4 py-2">
              {rootNode ? (
                <TreeNode member={rootNode} onAddRelative={handleAddRelative} onViewProfile={handleViewProfile} />
              ) : (
                <p className="text-muted-foreground">{t('No members in this tree yet.', 'इस वंशवृक्ष में अभी तक कोई सदस्य नहीं है।')}</p>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8 p-6 rounded-2xl border border-border bg-card/50">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {t('Build Your Own Family Tree', 'अपना खुद का वंशवृक्ष बनाएं')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('Create your family legacy on VanshMala', 'वंशमाला पर अपनी पारिवारिक विरासत बनाएं')}
            </p>
            <Button onClick={() => navigate('/register')} className="bg-primary text-primary-foreground">
              {t('Get Started Free', 'मुफ्त शुरू करें')}
            </Button>
          </div>
        </div>
      </div>

      {/* Link Request Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Request to Join Family', 'परिवार से जुड़ने का अनुरोध')}</DialogTitle>
            <DialogDescription>
              {t('Submit a request to link yourself to this family tree. The admin will review it.', 'इस वंशवृक्ष से जुड़ने का अनुरोध करें। एडमिन इसकी समीक्षा करेगा।')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t('Your Name', 'आपका नाम')}</label>
              <Input
                value={linkForm.full_name}
                onChange={e => setLinkForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder={t('Enter your full name', 'अपना पूरा नाम दर्ज करें')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('How are you related?', 'आप कैसे संबंधित हैं?')}</label>
              <Textarea
                value={linkForm.relationship_claim}
                onChange={e => setLinkForm(f => ({ ...f, relationship_claim: e.target.value }))}
                placeholder={t('e.g. I am son of Ramesh Kumar', 'उदा. मैं रमेश कुमार का बेटा हूं')}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button onClick={handleRequestLink} disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('Submit Request', 'अनुरोध सबमिट करें')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicTree;
