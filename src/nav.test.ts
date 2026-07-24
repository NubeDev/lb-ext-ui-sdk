import { describe, it, expect, vi, afterEach } from "vitest";
import { clampNavChildren, NAV_MAX_ITEMS, NAV_MAX_DEPTH, NAV_MAX_LABEL } from "./nav.js";
import type { ExtNavChild } from "./page.js";

afterEach(() => vi.restoreAllMocks());

describe("clampNavChildren", () => {
  it("passes a small tree through, normalized", () => {
    const items: ExtNavChild[] = [
      { id: "a", label: "Acme HQ", icon: "building" },
      { id: "b", label: "Depot", children: [{ id: "b1", label: "Bay 1" }] },
    ];
    expect(clampNavChildren(items)).toEqual(items);
  });

  it("truncates over-long labels and warns (never throws)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const long = "x".repeat(NAV_MAX_LABEL + 10);
    const out = clampNavChildren([{ id: "a", label: long }]);
    expect(out[0].label).toHaveLength(NAV_MAX_LABEL);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("caps total item count and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const many: ExtNavChild[] = Array.from({ length: NAV_MAX_ITEMS + 25 }, (_, i) => ({
      id: `s-${i}`,
      label: `Site ${i}`,
    }));
    const out = clampNavChildren(many);
    expect(out).toHaveLength(NAV_MAX_ITEMS);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("counts nested nodes toward the total cap", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // 100 parents each with 2 children = 300 nodes → clamped to 200.
    const nested: ExtNavChild[] = Array.from({ length: 100 }, (_, i) => ({
      id: `p-${i}`,
      label: `P${i}`,
      children: [
        { id: `p-${i}-a`, label: "a" },
        { id: `p-${i}-b`, label: "b" },
      ],
    }));
    const count = (nodes: ExtNavChild[]): number =>
      nodes.reduce((n, c) => n + 1 + (c.children ? count(c.children) : 0), 0);
    expect(count(clampNavChildren(nested))).toBe(NAV_MAX_ITEMS);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("drops nodes deeper than the depth cap and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // depth 1 → 2 → 3 → 4 (the depth-4 node must be dropped; NAV_MAX_DEPTH = 3).
    const deep: ExtNavChild = {
      id: "d1",
      label: "1",
      children: [{ id: "d2", label: "2", children: [{ id: "d3", label: "3", children: [{ id: "d4", label: "4" }] }] }],
    };
    const out = clampNavChildren([deep]);
    const d3 = out[0].children![0].children![0];
    expect(d3.id).toBe("d3");
    expect(d3.children).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(NAV_MAX_DEPTH).toBe(3);
  });

  it("returns [] for empty/undefined input without warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(clampNavChildren([])).toEqual([]);
    expect(clampNavChildren(undefined as unknown as ExtNavChild[])).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
