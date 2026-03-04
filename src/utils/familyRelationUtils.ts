/**
 * familyRelationUtils.ts
 *
 * Client-side relationship validation helpers. These mirror the DB-level
 * triggers so users get instant feedback before any network call is made.
 * The DB triggers are the final safety net; this layer gives great UX.
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type RelationshipType = Database["public"]["Enums"]["relationship_type"];

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the number of parents a child already has in the tree. */
export const getParentCount = async (
    childId: string,
    treeId: string
): Promise<number> => {
    const { count, error } = await supabase
        .from("family_relationships")
        .select("*", { count: "exact", head: true })
        .eq("to_member_id", childId)
        .eq("tree_id", treeId)
        .eq("relationship", "parent");

    if (error) throw error;
    return count ?? 0;
};

/** Returns the id of the existing spouse, or null if none. */
export const getSpouseId = async (
    memberId: string,
    treeId: string
): Promise<string | null> => {
    const { data, error } = await supabase
        .from("family_relationships")
        .select("from_member_id, to_member_id")
        .eq("tree_id", treeId)
        .eq("relationship", "spouse")
        .or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId}`)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return data.from_member_id === memberId
        ? data.to_member_id
        : data.from_member_id;
};

/** Checks if a relationship already exists in either direction. */
export const relationshipExists = async (
    fromId: string,
    toId: string,
    type: RelationshipType,
    treeId: string
): Promise<boolean> => {
    const { count, error } = await supabase
        .from("family_relationships")
        .select("*", { count: "exact", head: true })
        .eq("tree_id", treeId)
        .eq("relationship", type)
        .or(
            `and(from_member_id.eq.${fromId},to_member_id.eq.${toId}),and(from_member_id.eq.${toId},to_member_id.eq.${fromId})`
        );

    if (error) throw error;
    return (count ?? 0) > 0;
};

/**
 * Returns the parent IDs of a given member within a tree.
 * Used so that when adding a sibling, we can inherit parents.
 */
export const getParentIds = async (
    memberId: string,
    treeId: string
): Promise<string[]> => {
    const { data, error } = await supabase
        .from("family_relationships")
        .select("from_member_id")
        .eq("to_member_id", memberId)
        .eq("tree_id", treeId)
        .eq("relationship", "parent");

    if (error) throw error;
    return (data ?? []).map((r) => r.from_member_id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
    ok: boolean;
    errorCode?:
    | "SELF_RELATION"
    | "MAX_PARENTS"
    | "MAX_SPOUSE"
    | "DUPLICATE_RELATION";
    error?: string;
}

export interface ValidateRelationshipParams {
    /** The existing member being referenced (e.g. "add child TO this member") */
    relativeId: string;
    /**
     * The new member's id (if already created) or undefined.
     * Used for self-relation check when linking an existing profile.
     */
    newMemberId?: string;
    relationType: RelationshipType;
    treeId: string;
}

/**
 * Runs all guardrail checks and returns a validation result.
 * This is async because it queries the DB for current state.
 */
export const validateRelationship = async ({
    relativeId,
    newMemberId,
    relationType,
    treeId,
}: ValidateRelationshipParams): Promise<ValidationResult> => {
    // ── Guard 1: Self-relation ─────────────────────────────────
    if (newMemberId && newMemberId === relativeId) {
        return {
            ok: false,
            errorCode: "SELF_RELATION",
            error: "A member cannot be related to themselves.",
        };
    }

    // ── Guard 2: Max 2 parents ─────────────────────────────────
    if (relationType === "parent") {
        // "Add parent TO relativeId" means relativeId is the child
        const parentCount = await getParentCount(relativeId, treeId);
        if (parentCount >= 2) {
            return {
                ok: false,
                errorCode: "MAX_PARENTS",
                error: `This member already has ${parentCount} parent(s). A child cannot have more than 2 parents.`,
            };
        }
    }

    // When adding a CHILD: relativeId is the parent, newMemberId (if known) will be child
    // Parent count for newMemberId checked when we know its id (post-creation handled by DB trigger)

    // ── Guard 3: Max 1 spouse ──────────────────────────────────
    if (relationType === "spouse") {
        // Check if the relative already has a spouse
        const existingSpouseId = await getSpouseId(relativeId, treeId);
        if (existingSpouseId) {
            return {
                ok: false,
                errorCode: "MAX_SPOUSE",
                error: "This member already has a spouse.",
            };
        }
        // Also check new member if known
        if (newMemberId) {
            const newMemberSpouseId = await getSpouseId(newMemberId, treeId);
            if (newMemberSpouseId) {
                return {
                    ok: false,
                    errorCode: "MAX_SPOUSE",
                    error: "The selected member already has a spouse.",
                };
            }
        }
    }

    // ── Guard 4: Duplicate relationship ───────────────────────
    if (newMemberId) {
        const exists = await relationshipExists(
            relativeId,
            newMemberId,
            relationType === "child" ? "parent" : relationType,
            treeId
        );
        if (exists) {
            return {
                ok: false,
                errorCode: "DUPLICATE_RELATION",
                error: "This relationship already exists between these two members.",
            };
        }
    }

    return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// Relationship description helpers (for UI)
// ─────────────────────────────────────────────────────────────────────────────

export const getRelationshipLabel = (type: RelationshipType): string => {
    const labels: Record<RelationshipType, string> = {
        parent: "Parent",
        child: "Child",
        spouse: "Spouse",
        sibling: "Sibling",
    };
    return labels[type] ?? type;
};

export const getRelationshipHint = (type: RelationshipType): string => {
    const hints: Record<RelationshipType, string> = {
        parent:
            "Max 2 parents allowed. Adding a parent automatically links co-parents as spouses.",
        child:
            "Adding a child auto-links them as siblings to all existing children of this parent.",
        spouse:
            "Each member can have only one spouse. Both sides are linked automatically.",
        sibling:
            "Siblings will also inherit shared parents automatically.",
    };
    return hints[type] ?? "";
};
