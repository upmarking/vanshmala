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
    // Build relationships
    relationships.forEach(rel => {
        const fromNode = memberMap.get(rel.from_member_id);
        const toNode = memberMap.get(rel.to_member_id);

        if (!fromNode || !toNode) return;

        if (rel.relationship === 'parent') {
            // fromNode is Parent, toNode is Child
            fromNode.children?.push(toNode);
            toNode.parents?.push(fromNode);
        } else if (rel.relationship === 'child') {
            // Legacy/Pivot: fromNode is Child, toNode is Parent
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

    // Find root
    // Ideally root is someone with no parents in the current set, or the oldest generation.
    // Let's find the member with minimum generation_level
    let root = members[0];
    let minGen = members[0].generation_level || 100;

    members.forEach(m => {
        const gen = m.generation_level || 100;
        if (gen < minGen) {
            minGen = gen;
            root = m;
        }
    });

    // Or find someone with no parents
    const possibleRoots = members.filter(m => {
        const node = memberMap.get(m.id);
        return (!node?.parents || node.parents.length === 0);
    });

    if (possibleRoots.length > 0) {
        // Pick the one with smallest generation or just the first
        // Prioritize male ancestor for traditional trees? user request didn't specify.
        // Let's just pick the first one which is likely the oldest ancestor added.
        return memberMap.get(possibleRoots[0].id) || null;
    }

    return memberMap.get(root.id) || null;
};
