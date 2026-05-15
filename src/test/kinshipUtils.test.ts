import { describe, it, expect } from "vitest";
import { translateKinshipPath } from "@/utils/kinshipUtils";
import { Database } from "@/integrations/supabase/types";

type Member = Database['public']['Tables']['family_members']['Row'];

// Helper to create a mock member
const createMember = (id: string, gender: 'male' | 'female' | 'other' | null): Member => ({
    id,
    gender,
    first_name: `Test${id}`,
    last_name: 'User',
    birth_date: null,
    birth_date_unknown: null,
    death_date: null,
    death_date_unknown: null,
    is_alive: true,
    created_at: '',
    updated_at: '',
    tree_id: 'tree-1',
    user_id: 'user-1',
    notes: null,
    profile_picture_url: null,
    generation_level: null,
    generation_order: null,
});

const members: Member[] = [
    createMember('m-male', 'male'),
    createMember('m-female', 'female'),
    createMember('m-other', 'other'),
    createMember('m-null', null),
    createMember('mid-male', 'male'),
    createMember('mid-female', 'female'),
];

describe("translateKinshipPath", () => {
    it("returns 'You' when path is empty", () => {
        expect(translateKinshipPath([], members)).toBe("You");
    });

    it("returns 'Relative' when target member is not found", () => {
        expect(translateKinshipPath([{ to: 'unknown', type: 'parent' }], members)).toBe("Relative");
    });

    describe("1-step paths", () => {
        it("handles parent", () => {
            expect(translateKinshipPath([{ to: 'm-male', type: 'parent' }], members)).toBe("Father");
            expect(translateKinshipPath([{ to: 'm-female', type: 'parent' }], members)).toBe("Mother");
            expect(translateKinshipPath([{ to: 'm-other', type: 'parent' }], members)).toBe("Parent");
            expect(translateKinshipPath([{ to: 'm-null', type: 'parent' }], members)).toBe("Parent");
        });

        it("handles child", () => {
            expect(translateKinshipPath([{ to: 'm-male', type: 'child' }], members)).toBe("Son");
            expect(translateKinshipPath([{ to: 'm-female', type: 'child' }], members)).toBe("Daughter");
            expect(translateKinshipPath([{ to: 'm-other', type: 'child' }], members)).toBe("Child");
        });

        it("handles spouse", () => {
            expect(translateKinshipPath([{ to: 'm-male', type: 'spouse' }], members)).toBe("Husband");
            expect(translateKinshipPath([{ to: 'm-female', type: 'spouse' }], members)).toBe("Wife");
            expect(translateKinshipPath([{ to: 'm-other', type: 'spouse' }], members)).toBe("Spouse");
        });

        it("handles sibling", () => {
            expect(translateKinshipPath([{ to: 'm-male', type: 'sibling' }], members)).toBe("Brother");
            expect(translateKinshipPath([{ to: 'm-female', type: 'sibling' }], members)).toBe("Sister");
            expect(translateKinshipPath([{ to: 'm-other', type: 'sibling' }], members)).toBe("Sibling");
        });
    });

    describe("2-step paths", () => {
        it("handles grandparents (paternal)", () => {
            const pathBase = [{ to: 'mid-male', type: 'parent' }];
            expect(translateKinshipPath([...pathBase, { to: 'm-male', type: 'parent' }], members)).toBe("Paternal Grandfather (Dada/Nana)");
            expect(translateKinshipPath([...pathBase, { to: 'm-female', type: 'parent' }], members)).toBe("Paternal Grandmother (Dadi/Nani)");
            expect(translateKinshipPath([...pathBase, { to: 'm-other', type: 'parent' }], members)).toBe("Paternal Grandparent");
        });

        it("handles grandparents (maternal)", () => {
            const pathBase = [{ to: 'mid-female', type: 'parent' }];
            expect(translateKinshipPath([...pathBase, { to: 'm-male', type: 'parent' }], members)).toBe("Maternal Grandfather (Dada/Nana)");
            expect(translateKinshipPath([...pathBase, { to: 'm-female', type: 'parent' }], members)).toBe("Maternal Grandmother (Dadi/Nani)");
            expect(translateKinshipPath([...pathBase, { to: 'm-other', type: 'parent' }], members)).toBe("Maternal Grandparent");
        });

        it("handles grandchildren", () => {
            const pathBase = [{ to: 'mid-male', type: 'child' }];
            expect(translateKinshipPath([...pathBase, { to: 'm-male', type: 'child' }], members)).toBe("Grandson");
            expect(translateKinshipPath([...pathBase, { to: 'm-female', type: 'child' }], members)).toBe("Granddaughter");
            expect(translateKinshipPath([...pathBase, { to: 'm-other', type: 'child' }], members)).toBe("Grandchild");
        });

        it("handles uncles/aunts", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'm-male', type: 'sibling' }], members)).toBe("Paternal Uncle");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'm-female', type: 'sibling' }], members)).toBe("Paternal Aunt");
            expect(translateKinshipPath([{ to: 'mid-female', type: 'parent' }, { to: 'm-male', type: 'sibling' }], members)).toBe("Maternal Uncle");
            expect(translateKinshipPath([{ to: 'mid-female', type: 'parent' }, { to: 'm-female', type: 'sibling' }], members)).toBe("Maternal Aunt");
            expect(translateKinshipPath([{ to: 'mid-female', type: 'parent' }, { to: 'm-other', type: 'sibling' }], members)).toBe("Maternal Uncle/Aunt");
        });

        it("handles niece/nephew", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'sibling' }, { to: 'm-male', type: 'child' }], members)).toBe("Nephew");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'sibling' }, { to: 'm-female', type: 'child' }], members)).toBe("Niece");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'sibling' }, { to: 'm-other', type: 'child' }], members)).toBe("Nephew/Niece");
        });

        it("handles parents-in-law", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-male', type: 'parent' }], members)).toBe("Father-in-law");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-female', type: 'parent' }], members)).toBe("Mother-in-law");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-other', type: 'parent' }], members)).toBe("Parent-in-law");
        });

        it("handles siblings-in-law", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-male', type: 'sibling' }], members)).toBe("Brother-in-law");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-female', type: 'sibling' }], members)).toBe("Sister-in-law");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'spouse' }, { to: 'm-other', type: 'sibling' }], members)).toBe("Sibling-in-law");
        });
    });

    describe("3-step paths", () => {
        it("handles first cousins", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'mid-female', type: 'sibling' }, { to: 'm-male', type: 'child' }], members)).toBe("Paternal First Cousin");
            expect(translateKinshipPath([{ to: 'mid-female', type: 'parent' }, { to: 'mid-male', type: 'sibling' }, { to: 'm-female', type: 'child' }], members)).toBe("Maternal First Cousin");
            expect(translateKinshipPath([{ to: 'm-other', type: 'parent' }, { to: 'mid-male', type: 'sibling' }, { to: 'm-female', type: 'child' }], members)).toBe("First Cousin");
        });

        it("handles great grandparents", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'mid-female', type: 'parent' }, { to: 'm-male', type: 'parent' }], members)).toBe("Great Grandfather");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'mid-female', type: 'parent' }, { to: 'm-female', type: 'parent' }], members)).toBe("Great Grandmother");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'parent' }, { to: 'mid-female', type: 'parent' }, { to: 'm-other', type: 'parent' }], members)).toBe("Great Grandparent");
        });

        it("handles great grandchildren", () => {
            expect(translateKinshipPath([{ to: 'mid-male', type: 'child' }, { to: 'mid-female', type: 'child' }, { to: 'm-male', type: 'child' }], members)).toBe("Great Grandson");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'child' }, { to: 'mid-female', type: 'child' }, { to: 'm-female', type: 'child' }], members)).toBe("Great Granddaughter");
            expect(translateKinshipPath([{ to: 'mid-male', type: 'child' }, { to: 'mid-female', type: 'child' }, { to: 'm-other', type: 'child' }], members)).toBe("Great Grandchild");
        });
    });

    describe("Distant relative fallback", () => {
        it("handles generic paths longer than 3 steps", () => {
            expect(translateKinshipPath([
                { to: 'mid-male', type: 'parent' },
                { to: 'mid-female', type: 'parent' },
                { to: 'mid-male', type: 'parent' },
                { to: 'm-male', type: 'parent' }
            ], members)).toBe("Distant Relative (4 connections away)");
        });

        it("handles generic paths of length 2 that don't match specific rules", () => {
            // e.g. parent's child (which would be sibling or self, but if BFS gave it...)
            expect(translateKinshipPath([
                { to: 'mid-male', type: 'parent' },
                { to: 'm-male', type: 'child' }
            ], members)).toBe("Distant Relative (2 connections away)");
        });
    });
});
