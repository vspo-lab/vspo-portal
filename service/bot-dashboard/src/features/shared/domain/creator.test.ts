import { AppError } from "@vspo-lab/error";
import { Creator, type CreatorType } from "./creator";

const sampleCreators: CreatorType[] = [
  { id: "c1", name: "Creator JP1", memberType: "vspo_jp", thumbnailUrl: null },
  {
    id: "c2",
    name: "Creator EN1",
    memberType: "vspo_en",
    thumbnailUrl: "https://example.com/c2.png",
  },
  { id: "c3", name: "Creator JP2", memberType: "vspo_jp", thumbnailUrl: null },
];

describe("Creator", () => {
  describe("fromApiResponse", () => {
    it("parses valid array", () => {
      const raw = [
        {
          id: "1",
          name: "Test",
          memberType: "vspo_jp",
          thumbnailUrl: null,
        },
      ];
      const result = Creator.fromApiResponse(raw);
      expect(result.err).toBeUndefined();
      expect(result.val).toEqual(raw);
    });

    it("parses empty array", () => {
      const result = Creator.fromApiResponse([]);
      expect(result.err).toBeUndefined();
      expect(result.val).toEqual([]);
    });

    it.each([
      ["null", null],
      ["string", "not-array"],
      ["object with missing fields", [{ id: "1" }]],
      [
        "invalid memberType",
        [{ id: "1", name: "X", memberType: "invalid", thumbnailUrl: null }],
      ],
    ])("returns Err for invalid input: %s", (_label, raw) => {
      const result = Creator.fromApiResponse(raw);
      expect(result.err).toBeDefined();
      expect(result.err).toBeInstanceOf(AppError);
    });
  });

  describe("filterByType", () => {
    it("filters by vspo_jp", () => {
      const result = Creator.filterByType(sampleCreators, "vspo_jp");
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.memberType === "vspo_jp")).toBe(true);
    });

    it("filters by vspo_en", () => {
      const result = Creator.filterByType(sampleCreators, "vspo_en");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c2");
    });

    it("returns empty when no match", () => {
      const jpOnly: CreatorType[] = [
        {
          id: "c1",
          name: "JP",
          memberType: "vspo_jp",
          thumbnailUrl: null,
        },
      ];
      expect(Creator.filterByType(jpOnly, "vspo_en")).toEqual([]);
    });
  });

  describe("filterByIds", () => {
    it("filters by id set", () => {
      const ids = new Set(["c1", "c3"]);
      const result = Creator.filterByIds(sampleCreators, ids);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toEqual(["c1", "c3"]);
    });

    it("returns empty when no ids match", () => {
      const ids = new Set(["nonexistent"]);
      expect(Creator.filterByIds(sampleCreators, ids)).toEqual([]);
    });

    it("returns empty for empty set", () => {
      expect(Creator.filterByIds(sampleCreators, new Set())).toEqual([]);
    });
  });
});
