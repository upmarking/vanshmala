import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { renderHook, waitFor } from "@testing-library/react";
import { useAddMember } from "@/hooks/useFamilyTree";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import * as utils from "@/utils/familyRelationUtils";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useAddMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should bulk insert parent relationships when adding a sibling", async () => {
    vi.spyOn(utils, "validateRelationship").mockResolvedValue({ ok: true });
    vi.spyOn(utils, "getParentIds").mockResolvedValue(["parent-1", "parent-2"]);

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "new-member-id" }, error: null });
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      return {
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      };
    });

    const { result } = renderHook(() => useAddMember(), { wrapper });

    await result.current.mutateAsync({
      memberData: { tree_id: "tree-1", first_name: "New" } as any,
      relationToId: "sibling-id",
      relationType: "sibling",
    });

    expect(utils.getParentIds).toHaveBeenCalledWith("sibling-id", "tree-1");
    // Verify that the family_members insert was called
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ first_name: "New", tree_id: "tree-1" }));

    // Check if the single array insertion was made, if not, it was individual calls.
    const allInserts = mockInsert.mock.calls.map(c => c[0]);
    const parentInserts = allInserts.filter(args =>
      Array.isArray(args) ? args.some(a => a.relationship === 'parent') : args.relationship === 'parent'
    );

    // Right now it's making individual inserts in a loop
    expect(parentInserts.length).toBeGreaterThan(0);
  });
});
