const fs = require('fs');
let content = fs.readFileSync('src/pages/FamilyTree.tsx', 'utf8');
content = content.replace(
  `  // Performance optimization: Memoize handler to prevent unnecessary re-renders in tree nodes
  const handleViewProfile = useCallback((member: FamilyTreeNode) => {
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
  }, [treeId, t]);`,
  `  // Performance optimization: Memoize handler to prevent unnecessary re-renders in tree nodes
  const handleViewProfile = useCallback((member: FamilyTreeNode) => {
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
  }, [treeId, t]);`
);
fs.writeFileSync('src/pages/FamilyTree.tsx', content);
