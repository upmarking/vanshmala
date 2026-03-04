import { Database } from "@/integrations/supabase/types";

type Member = Database['public']['Tables']['family_members']['Row'];
type Relationship = Database['public']['Tables']['family_relationships']['Row'];

export interface FamilyTreeNode extends Member {
    children?: FamilyTreeNode[];
    spouse?: FamilyTreeNode;
    parents?: Member[];
    siblings?: Member[];
}

/**
 * Build the visual family tree.
 *
 * Key rules:
 *  - A node may have AT MOST 2 parents.
 *  - Children are deduplicated: a shared child lives ONLY under the PRIMARY parent
 *    (male wins; if same/unknown gender → LEAST UUID wins for determinism).
 *  - Spouses are inferred automatically from co-parenting if no explicit spouse row exists.
 *  - Root deduplication: if two root nodes are spouses, the "to_member_id" side in the
 *    spouse relationship is suppressed (it will appear as .spouse on its partner's card).
 *  - If no explicit direction exists, gender then UUID sort provides a stable primary.
 */
export const buildFamilyTree = (
    members: Member[],
    relationships: Relationship[]
): FamilyTreeNode | null => {
    if (!members || members.length === 0) return null;

    const memberMap = new Map<string, FamilyTreeNode>();
    members.forEach(m => {
        memberMap.set(m.id, { ...m, children: [], parents: [], siblings: [] });
    });

    // ── PASS 1: Spouse links (explicit) ──────────────────────────────────
    // spousePrimary: from_member_id → to_member_id (the 'from' side is primary)
    const spousePrimary = new Map<string, string>(); // from → to

    relationships.forEach(rel => {
        if (rel.relationship !== 'spouse') return;
        const fromNode = memberMap.get(rel.from_member_id);
        const toNode = memberMap.get(rel.to_member_id);
        if (!fromNode || !toNode) return;
        fromNode.spouse = toNode;
        toNode.spouse = fromNode;
        spousePrimary.set(rel.from_member_id, rel.to_member_id);
    });

    // ── PASS 2: Parent links + max-2-parents enforcement ─────────────────
    // primaryParentOf[childId] = primaryParentId
    const primaryParentOf = new Map<string, string>();

    relationships.forEach(rel => {
        if (rel.relationship !== 'parent') return;
        const parentNode = memberMap.get(rel.from_member_id);
        const childNode = memberMap.get(rel.to_member_id);
        if (!parentNode || !childNode) return;

        // Max 2 parents
        if ((childNode.parents?.length ?? 0) >= 2) return;

        childNode.parents?.push(parentNode);

        if (!primaryParentOf.has(childNode.id)) {
            primaryParentOf.set(childNode.id, parentNode.id);
        } else {
            // Already has a primary. Male parent takes priority.
            // Tiebreaker: LEAST UUID (deterministic).
            const existingId = primaryParentOf.get(childNode.id)!;
            const existing = memberMap.get(existingId);
            const isFatherNew = parentNode.gender === 'male' && existing?.gender !== 'male';
            if (isFatherNew) {
                primaryParentOf.set(childNode.id, parentNode.id);
            }
        }
    });

    // ── PASS 3: Infer spouse from co-parents (if no explicit spouse row) ──
    // For each child with 2 parents that aren't already spouses, link them.
    primaryParentOf.forEach((primaryId, childId) => {
        const childNode = memberMap.get(childId);
        if (!childNode?.parents || childNode.parents.length < 2) return;

        const p1Id = primaryId;
        const p2Id = childNode.parents.find(p => p.id !== p1Id)?.id;
        if (!p2Id) return;

        const p1Node = memberMap.get(p1Id);
        const p2Node = memberMap.get(p2Id);
        if (!p1Node || !p2Node) return;

        if (!p1Node.spouse && !p2Node.spouse) {
            p1Node.spouse = p2Node;
            p2Node.spouse = p1Node;
            // Record p1 as primary (mirrors auto-created spouse row direction)
            spousePrimary.set(p1Id, p2Id);
        }
    });

    // ── PASS 4: Sibling links ─────────────────────────────────────────────
    relationships.forEach(rel => {
        if (rel.relationship !== 'sibling') return;
        const fromNode = memberMap.get(rel.from_member_id);
        const toNode = memberMap.get(rel.to_member_id);
        if (!fromNode || !toNode) return;
        fromNode.siblings?.push(toNode);
        toNode.siblings?.push(fromNode);
    });

    // ── PASS 5: Distribute children to primary parent only ───────────────
    primaryParentOf.forEach((parentId, childId) => {
        const parentNode = memberMap.get(parentId);
        const childNode = memberMap.get(childId);
        if (!parentNode || !childNode) return;
        if (!parentNode.children!.find(c => c.id === childId)) {
            parentNode.children!.push(childNode);
        }
    });

    // ── FIND ROOT NODES ───────────────────────────────────────────────────
    const childIds = new Set(primaryParentOf.keys());
    const rootNodes = members.filter(m => !childIds.has(m.id));

    if (rootNodes.length === 0) {
        // Fallback: lowest generation_level
        const root = members.reduce((best, m) =>
            (m.generation_level ?? 100) < (best.generation_level ?? 100) ? m : best
        );
        return memberMap.get(root.id) || null;
    }

    if (rootNodes.length === 1) {
        return memberMap.get(rootNodes[0].id) || null;
    }

    // ── SUPPRESS SPOUSE DUPLICATES FROM ROOT LIST ─────────────────────────
    // For any two root nodes that are spouses:
    //   Primary = the 'from_member_id' in the spouse relationship.
    //   If no explicit direction: male first, then LEAST UUID.
    const rootIdSet = new Set(rootNodes.map(m => m.id));
    const nonPrimarySpouseIds = new Set<string>();

    rootNodes.forEach(m => {
        if (nonPrimarySpouseIds.has(m.id)) return; // already suppressed
        const node = memberMap.get(m.id);
        const spouseNode = node?.spouse as FamilyTreeNode | undefined;
        if (!spouseNode || !rootIdSet.has(spouseNode.id)) return;

        // Both are roots and are spouses — pick one as primary
        const mIsFrom = spousePrimary.has(m.id) && spousePrimary.get(m.id) === spouseNode.id;
        const spouseIsFrom = spousePrimary.has(spouseNode.id) && spousePrimary.get(spouseNode.id) === m.id;

        let suppressId: string;
        if (mIsFrom && !spouseIsFrom) {
            suppressId = spouseNode.id; // m is primary
        } else if (spouseIsFrom && !mIsFrom) {
            suppressId = m.id;          // spouse is primary
        } else {
            // No clear direction — gender then UUID sort
            const mFemale = node?.gender === 'female';
            const spouseFemale = spouseNode.gender === 'female';
            if (mFemale && !spouseFemale) suppressId = m.id;
            else if (!mFemale && spouseFemale) suppressId = spouseNode.id;
            else suppressId = m.id > spouseNode.id ? m.id : spouseNode.id; // LEAST UUID wins
        }
        nonPrimarySpouseIds.add(suppressId);
    });

    // ── PASS 2: Suppress root whose spouse is a CHILD (non-root) ─────────
    // Example: Ajay is a child of Shriram (non-root). Rinku is Ajay's spouse
    // and has no parents of her own (so she becomes a root). Without this,
    // Rinku renders TWICE: as a standalone root AND as Ajay's spouse card.
    // Fix: suppress Rinku from roots — she'll appear as Ajay's spouse card.
    rootNodes.forEach(m => {
        if (nonPrimarySpouseIds.has(m.id)) return; // already suppressed
        const node = memberMap.get(m.id);
        const spouseNode = node?.spouse as FamilyTreeNode | undefined;
        if (spouseNode && childIds.has(spouseNode.id)) {
            // Spouse is a child of someone → suppress this root
            nonPrimarySpouseIds.add(m.id);
        }
    });

    const primaryRoots = rootNodes
        .filter(m => !nonPrimarySpouseIds.has(m.id))
        .sort((a, b) =>
            (a.generation_level ?? 1) - (b.generation_level ?? 1) ||
            a.full_name.localeCompare(b.full_name)
        )
        .map(m => memberMap.get(m.id)!);

    if (primaryRoots.length === 1) {
        return primaryRoots[0];
    }



    // Virtual root for multiple disconnected subtrees
    const virtualRoot: FamilyTreeNode = {
        id: '__virtual_root__',
        tree_id: primaryRoots[0].tree_id,
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
        kuldevi: null,
        kuldevta: null,
        mool_niwas: null,
        children: primaryRoots,
        parents: [],
        siblings: [],
    };

    return virtualRoot;
};

export const getGenerationName = (dateOfBirth: string | null): string | null => {
    if (!dateOfBirth) return null;
    const year = new Date(dateOfBirth).getFullYear();
    if (year >= 2013) return "Generation Alpha";
    if (year >= 1997) return "Generation Z";
    if (year >= 1981) return "Millennial";
    if (year >= 1965) return "Generation X";
    if (year >= 1946) return "Baby Boomer";
    if (year >= 1928) return "Silent Generation";
    if (year >= 1901) return "Greatest Generation";
    return "Lost Generation";
};
