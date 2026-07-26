import { describe, it, expect, vi, afterEach } from "vitest";
import {
  clampNavChildren,
  NAV_MAX_ITEMS,
  NAV_MAX_DEPTH,
  NAV_MAX_LABEL,
  NAV_MAX_VARS,
  NAV_MAX_VAR_KV,
} from "./nav.js";
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

  it("copies a dashboard ref + vars verbatim (ext-dashboard-nav)", () => {
    const items: ExtNavChild[] = [
      {
        id: "site-1",
        label: "Acme HQ",
        dashboard: "dashboard:ems-site-overview",
        vars: { site: "site-1" },
        children: [
          { id: "m/meter-1", label: "Meter 1" },
          { id: "m/meter-1/board", label: "Meter 1 · Board", dashboard: "dashboard:ems-meter-detail", vars: { meter: "meter-1" } },
        ],
      },
    ];
    const out = clampNavChildren(items);
    expect(out[0].dashboard).toBe("dashboard:ems-site-overview");
    expect(out[0].vars).toEqual({ site: "site-1" });
    // The ext-route child keeps no dashboard; the board child carries the meter binding.
    expect(out[0].children![0].dashboard).toBeUndefined();
    expect(out[0].children![1].dashboard).toBe("dashboard:ems-meter-detail");
    expect(out[0].children![1].vars).toEqual({ meter: "meter-1" });
  });

  it("strips smuggled extra fields (whitelist copy)", () => {
    const smuggled = { id: "a", label: "A", evil: "x", vars: { site: "s1" }, dashboard: "dashboard:d" } as unknown as ExtNavChild;
    const out = clampNavChildren([smuggled]);
    expect(out[0]).toEqual({ id: "a", label: "A", dashboard: "dashboard:d", vars: { site: "s1" } });
    expect((out[0] as Record<string, unknown>).evil).toBeUndefined();
  });

  it("drops over-cap vars (count + oversized key/value) and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const many: Record<string, string> = {};
    for (let i = 0; i < NAV_MAX_VARS + 5; i++) many[`k${i}`] = "v";
    const bigVal = "y".repeat(NAV_MAX_VAR_KV + 1);
    const out = clampNavChildren([
      { id: "a", label: "A", dashboard: "dashboard:d", vars: { ...many, tooLong: bigVal } },
    ]);
    // At most NAV_MAX_VARS keys survive, and the oversized value is dropped (never sliced to a wrong id).
    expect(Object.keys(out[0].vars ?? {}).length).toBeLessThanOrEqual(NAV_MAX_VARS);
    expect(out[0].vars?.tooLong).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  // ── `hasChildren` — "I have children you haven't been given" (ext-nav-lazy-children scope) ────────

  it("copies `hasChildren` verbatim on a node with no children", () => {
    const out = clampNavChildren([{ id: "n1", label: "Plant A", hasChildren: true }]);
    expect(out[0]).toEqual({ id: "n1", label: "Plant A", hasChildren: true });
  });

  it("DROPS `hasChildren` once real children survived the clamp (the branch beats the promise)", () => {
    // Keeping both would leave the host holding two answers to "does this node have more"; the one it
    // can actually see wins, and the flag has done its job.
    const out = clampNavChildren([
      { id: "n1", label: "Plant A", hasChildren: true, children: [{ id: "d1", label: "Chiller 1" }] },
    ]);
    expect(out[0].children).toHaveLength(1);
    expect(out[0].hasChildren).toBeUndefined();
  });

  it("KEEPS `hasChildren` when the children were clamped away by depth", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Sit the flagged node at exactly NAV_MAX_DEPTH, so ITS children fall over the edge and are dropped
    // — but those children DO exist, so the node must keep offering to be asked.
    let node: ExtNavChild = { id: "deep", label: "Deep", hasChildren: true, children: [{ id: "x", label: "X" }] };
    for (let d = 0; d < NAV_MAX_DEPTH - 1; d++) node = { id: `l${d}`, label: `L${d}`, children: [node] };
    const out = clampNavChildren([node]);
    let cur = out[0];
    while (cur.children?.length) cur = cur.children[0];
    expect(cur.hasChildren).toBe(true);
    expect(cur.children).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("ignores a falsy/garbage `hasChildren` (only an explicit true is a promise)", () => {
    const out = clampNavChildren([
      { id: "a", label: "A", hasChildren: false },
      { id: "b", label: "B", hasChildren: "yes" as unknown as boolean },
    ]);
    expect(out[0].hasChildren).toBeUndefined();
    expect(out[1].hasChildren).toBeUndefined();
  });

  it("returns [] for empty/undefined input without warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(clampNavChildren([])).toEqual([]);
    expect(clampNavChildren(undefined as unknown as ExtNavChild[])).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
