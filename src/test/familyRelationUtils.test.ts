/**
 * Unit tests for family relationship validation utilities.
 *
 * These tests mock the Supabase client to test the validation
 * logic in isolation from the database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ── Mock Supabase ─────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(),
    },
}));

import { supabase } from "@/integrations/supabase/client";
import {
    validateRelationship,
    getRelationshipHint,
    getRelationshipLabel,
} from "@/utils/familyRelationUtils";

// Helper: build a chainable Supabase mock that resolves to a given value
const mockSupabaseChain = (resolveValue: {
    count?: number | null;
    data?: any;
    error?: any;
}) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(resolveValue),
    };
    // For count queries the chain ends at .eq
    // We override the last .eq to resolve the value
    (chain.eq as Mock).mockImplementation(() => chain);
    chain._resolve = resolveValue;
    return chain;
};

// We set up different mock scenarios per test
const setupMocks = ({
    parentCount = 0,
    spouseExists = false,
    relationshipDuplicate = false,
}: {
    parentCount?: number;
    spouseExists?: boolean;
    relationshipDuplicate?: boolean;
}) => {
    (supabase.from as Mock).mockImplementation((table: string) => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        // Return count for parent queries
        chain.select.mockImplementation((_: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === "exact") {
                // This is a count query — resolve at the end of the chain
                chain.eq.mockImplementation(() => ({
                    eq: vi.fn().mockReturnThis(), // chain more .eq calls
                    // Final resolves with the count
                    then: (resolve: any) => resolve({ count: parentCount, error: null }),
                }));
            }
            return chain;
        });

        // For spouse check (or query)
        chain.or.mockImplementation(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
                data: spouseExists ? { from_member_id: "spouse-id", to_member_id: "member-a" } : null,
                error: null,
            }),
        }));

        return chain;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("validateRelationship", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects self-relation immediately without DB calls", async () => {
        const result = await validateRelationship({
            relativeId: "member-a",
            newMemberId: "member-a",
            relationType: "child",
            treeId: "tree-1",
        });

        expect(result.ok).toBe(false);
        expect(result.errorCode).toBe("SELF_RELATION");
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("rejects adding more than 2 parents", async () => {
        // Mock getParentCount to return 2
        (supabase.from as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
                    }),
                }),
            }),
        });

        const result = await validateRelationship({
            relativeId: "child-id",
            relationType: "parent",
            treeId: "tree-1",
        });

        expect(result.ok).toBe(false);
        expect(result.errorCode).toBe("MAX_PARENTS");
        expect(result.error).toMatch(/2 parent/i);
    });

    it("allows adding parent when child has fewer than 2 parents", async () => {
        (supabase.from as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
                    }),
                }),
            }),
        });

        const result = await validateRelationship({
            relativeId: "child-id",
            relationType: "parent",
            treeId: "tree-1",
        });

        expect(result.ok).toBe(true);
    });

    it("rejects adding a spouse when member already has one", async () => {
        // First call (getSpouseId for relativeId) returns a spouse
        (supabase.from as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        or: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: { from_member_id: "existing-spouse", to_member_id: "member-a" },
                                error: null,
                            }),
                        }),
                    }),
                }),
            }),
        });

        const result = await validateRelationship({
            relativeId: "member-a",
            relationType: "spouse",
            treeId: "tree-1",
        });

        expect(result.ok).toBe(false);
        expect(result.errorCode).toBe("MAX_SPOUSE");
    });

    it("allows adding spouse when member has none", async () => {
        (supabase.from as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        or: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                    }),
                }),
            }),
        });

        const result = await validateRelationship({
            relativeId: "member-a",
            relationType: "spouse",
            treeId: "tree-1",
        });

        expect(result.ok).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper function tests (no DB calls)
// ─────────────────────────────────────────────────────────────────────────────

describe("getRelationshipLabel", () => {
    it("returns correct labels", () => {
        expect(getRelationshipLabel("parent")).toBe("Parent");
        expect(getRelationshipLabel("child")).toBe("Child");
        expect(getRelationshipLabel("spouse")).toBe("Spouse");
        expect(getRelationshipLabel("sibling")).toBe("Sibling");
    });
});

describe("getRelationshipHint", () => {
    it("returns a non-empty hint for all 4 types", () => {
        const types = ["parent", "child", "spouse", "sibling"] as const;
        types.forEach((type) => {
            expect(getRelationshipHint(type).length).toBeGreaterThan(10);
        });
    });

    it("mentions max 2 parents in the parent hint", () => {
        expect(getRelationshipHint("parent")).toMatch(/2/);
    });

    it("mentions sibling auto-linking in the child hint", () => {
        expect(getRelationshipHint("child")).toMatch(/sibling/i);
    });
});
