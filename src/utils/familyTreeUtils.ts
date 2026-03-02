import { Database } from "@/integrations/supabase/types";

type Member = Database['public']['Tables']['family_members']['Row'];
type Relationship = Database['public']['Tables']['family_relationships']['Row'];

export interface FamilyTreeNode extends Member {
    children?: FamilyTreeNode[];
    spouse?: Member;
    parents?: Member[];
    siblings?: Member[];
}

export const buildFamilyTree = (members: Member[], relationships: Relationship[]): FamilyTreeNode | null => {
    if (!members || members.length === 0) return null;

    const memberMap = new Map<string, FamilyTreeNode>();

    // Initialize nodes
    members.forEach(member => {
        memberMap.set(member.id, { ...member, children: [], parents: [], siblings: [] });
    });

    // Build relationships
    relationships.forEach(rel => {
        const fromNode = memberMap.get(rel.from_member_id);
        const toNode = memberMap.get(rel.to_member_id);

        if (!fromNode || !toNode) return;

        if (rel.relationship === 'parent') {
            fromNode.children?.push(toNode);
            toNode.parents?.push(fromNode);
        } else if (rel.relationship === 'child') {
            toNode.children?.push(fromNode);
            fromNode.parents?.push(toNode);
        } else if (rel.relationship === 'spouse') {
            fromNode.spouse = toNode;
            toNode.spouse = fromNode;
        } else if (rel.relationship === 'sibling') {
            fromNode.siblings?.push(toNode);
            toNode.siblings?.push(fromNode);
        }
    });

    // Find all root nodes — members with no parent in the current set
    const rootNodes = members.filter(m => {
        const node = memberMap.get(m.id);
        return (!node?.parents || node.parents.length === 0);
    });

    if (rootNodes.length === 0) {
        // Fallback: just pick whoever has the lowest generation_level
        let root = members[0];
        let minGen = root.generation_level ?? 100;
        members.forEach(m => {
            const gen = m.generation_level ?? 100;
            if (gen < minGen) { minGen = gen; root = m; }
        });
        return memberMap.get(root.id) || null;
    }

    if (rootNodes.length === 1) {
        // Single root — return normally
        return memberMap.get(rootNodes[0].id) || null;
    }

    // Multiple roots (disconnected members): sort by generation_level, then name
    const sortedRoots = rootNodes
        .sort((a, b) => (a.generation_level ?? 1) - (b.generation_level ?? 1) || a.full_name.localeCompare(b.full_name))
        .map(m => memberMap.get(m.id)!);

    // Return the first root but attach the others as siblings so the UI can find them
    // Better: return a virtual container node with all roots as children
    const virtualRoot: FamilyTreeNode = {
        id: '__virtual_root__',
        tree_id: sortedRoots[0].tree_id,
        full_name: '',
        vanshmala_id: null,
        user_id: null,
        full_name_hi: null,
        gender: null,
        gotra: null,
        date_of_birth: null,
        date_of_death: null,
        is_alive: true,
        phone: null,
        avatar_url: null,
        bio: null,
        generation_level: 0,
        added_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        username: null,
        place_of_birth: null,
        blood_group: null,
        marriage_date: null,
        education: null,
        career: null,
        achievements: null,
        awards: null,
        migration_info: null,
        privacy_settings: null,
        children: sortedRoots,
        parents: [],
        siblings: [],
    };

    return virtualRoot;
};

