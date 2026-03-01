import { Database } from "@/integrations/supabase/types";

type Member = Database['public']['Tables']['family_members']['Row'];
type Relationship = Database['public']['Tables']['family_relationships']['Row'];

export interface KinshipResult {
    path: string[];
    relationText: string;
}

export const buildKinshipGraph = (members: Member[], relationships: Relationship[]) => {
    // Map memberId -> Array of edges
    // Edge: { to: string, type: 'parent' | 'child' | 'spouse' | 'sibling' }
    // type is "what 'to' is to 'from'". e.g. if 'type' is 'child', it means 'to' is the child of 'from'.
    const graph = new Map<string, { to: string; type: string }[]>();

    members.forEach(m => graph.set(m.id, []));

    relationships.forEach(rel => {
        const from = rel.from_member_id;
        const to = rel.to_member_id;

        if (!graph.has(from) || !graph.has(to)) return;

        if (rel.relationship === 'parent') {
            // from is parent of to
            // So 'to' is the child of 'from'
            graph.get(from)?.push({ to: to, type: 'child' });
            // 'from' is the parent of 'to'
            graph.get(to)?.push({ to: from, type: 'parent' });
        } else if (rel.relationship === 'child') {
            // legacy: from is child of to
            graph.get(from)?.push({ to: to, type: 'parent' });
            graph.get(to)?.push({ to: from, type: 'child' });
        } else if (rel.relationship === 'spouse') {
            graph.get(from)?.push({ to: to, type: 'spouse' });
            graph.get(to)?.push({ to: from, type: 'spouse' });
        } else if (rel.relationship === 'sibling') {
            graph.get(from)?.push({ to: to, type: 'sibling' });
            graph.get(to)?.push({ to: from, type: 'sibling' });
        }
    });

    return graph;
};

export const translateKinshipPath = (path: { to: string; type: string }[], members: Member[]): string => {
    if (path.length === 0) return "You";

    const memberMap = new Map(members.map(m => [m.id, m]));
    const targetNode = path[path.length - 1].to;
    const targetMember = memberMap.get(targetNode);
    if (!targetMember) return "Relative";

    const targetGender = targetMember.gender; // 'male' | 'female' | 'other' | null

    if (path.length === 1) {
        const step = path[0].type;
        if (step === 'parent') return targetGender === 'male' ? 'Father' : targetGender === 'female' ? 'Mother' : 'Parent';
        if (step === 'child') return targetGender === 'male' ? 'Son' : targetGender === 'female' ? 'Daughter' : 'Child';
        if (step === 'spouse') return targetGender === 'male' ? 'Husband' : targetGender === 'female' ? 'Wife' : 'Spouse';
        if (step === 'sibling') return targetGender === 'male' ? 'Brother' : targetGender === 'female' ? 'Sister' : 'Sibling';
    }

    if (path.length === 2) {
        const [step1, step2] = path;

        // Grandparents
        if (step1.type === 'parent' && step2.type === 'parent') {
            const side = memberMap.get(step1.to)?.gender === 'male' ? 'Paternal ' : memberMap.get(step1.to)?.gender === 'female' ? 'Maternal ' : '';
            if (targetGender === 'male') return side + 'Grandfather (Dada/Nana)';
            if (targetGender === 'female') return side + 'Grandmother (Dadi/Nani)';
            return side + 'Grandparent';
        }

        // Grandchildren
        if (step1.type === 'child' && step2.type === 'child') {
            if (targetGender === 'male') return 'Grandson';
            if (targetGender === 'female') return 'Granddaughter';
            return 'Grandchild';
        }

        // Uncles / Aunts
        if (step1.type === 'parent' && step2.type === 'sibling') {
            const side = memberMap.get(step1.to)?.gender === 'male' ? 'Paternal ' : memberMap.get(step1.to)?.gender === 'female' ? 'Maternal ' : '';
            if (targetGender === 'male') return side + 'Uncle';
            if (targetGender === 'female') return side + 'Aunt';
            return side + 'Uncle/Aunt';
        }

        // Niece / Nephew
        if (step1.type === 'sibling' && step2.type === 'child') {
            if (targetGender === 'male') return 'Nephew';
            if (targetGender === 'female') return 'Niece';
            return 'Nephew/Niece';
        }

        // Parents-in-law
        if (step1.type === 'spouse' && step2.type === 'parent') {
            if (targetGender === 'male') return 'Father-in-law';
            if (targetGender === 'female') return 'Mother-in-law';
            return 'Parent-in-law';
        }

        // Siblings-in-law
        if (step1.type === 'spouse' && step2.type === 'sibling') {
            if (targetGender === 'male') return 'Brother-in-law';
            if (targetGender === 'female') return 'Sister-in-law';
            return 'Sibling-in-law';
        }
    }

    if (path.length === 3) {
        const [step1, step2, step3] = path;

        // First Cousins
        if (step1.type === 'parent' && step2.type === 'sibling' && step3.type === 'child') {
            const side = memberMap.get(step1.to)?.gender === 'male' ? 'Paternal ' : memberMap.get(step1.to)?.gender === 'female' ? 'Maternal ' : '';
            return side + 'First Cousin';
        }

        // Great Grandparents
        if (step1.type === 'parent' && step2.type === 'parent' && step3.type === 'parent') {
            if (targetGender === 'male') return 'Great Grandfather';
            if (targetGender === 'female') return 'Great Grandmother';
            return 'Great Grandparent';
        }

        // Great Grandchildren
        if (step1.type === 'child' && step2.type === 'child' && step3.type === 'child') {
            if (targetGender === 'male') return 'Great Grandson';
            if (targetGender === 'female') return 'Great Granddaughter';
            return 'Great Grandchild';
        }
    }

    // Default distance based generic
    return `Distant Relative (${path.length} connection${path.length > 1 ? 's' : ''} away)`;
};

export const calculateKinship = (sourceId: string, targetId: string, members: Member[], relationships: Relationship[]): KinshipResult | null => {
    if (sourceId === targetId) {
        return { path: [], relationText: "You" };
    }

    const graph = buildKinshipGraph(members, relationships);
    if (!graph.has(sourceId) || !graph.has(targetId)) return null;

    // BFS
    const queue: { current: string; path: { to: string; type: string }[] }[] = [];
    const visited = new Set<string>();

    queue.push({ current: sourceId, path: [] });
    visited.add(sourceId);

    let shortestPath: { to: string; type: string }[] | null = null;

    while (queue.length > 0) {
        const { current, path } = queue.shift()!;

        if (current === targetId) {
            shortestPath = path;
            break;
        }

        const neighbors = graph.get(current) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.to)) {
                visited.add(neighbor.to);
                queue.push({
                    current: neighbor.to,
                    path: [...path, neighbor]
                });
            }
        }
    }

    if (!shortestPath) return null;

    return {
        path: shortestPath.map(p => p.type),
        relationText: translateKinshipPath(shortestPath, members)
    };
};
