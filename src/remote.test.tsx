// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { useEffect, useRef } from "react";
import { act } from "@testing-library/react";

import { defineRemote } from "./remote.js";
import type { PageBridge, PageCtx, PageHandle } from "./page.js";
import { useRoute } from "./runtime.js";
import type { WidgetBridge, WidgetCtx, WidgetHandle } from "./widget.js";

const ctx: PageCtx = { workspace: "nube" };
const bridge: PageBridge = { call: async () => ({}) as never };
const wctx: WidgetCtx = { v: 4, workspace: "nube", binding: {}, options: {} };
const wbridge: WidgetBridge = { call: async () => ({}) as never, watch: () => () => {} };

// `defineRemote` mounts via React's `createRoot().render()`, which commits asynchronously — wrap the
// mount in `act()` so the tree is flushed before assertions (the real shell awaits the same commit).
function mountAct(fn: () => void | (() => void)) {
  let teardown: void | (() => void);
  act(() => {
    teardown = fn();
  });
  return teardown;
}

describe("defineRemote — SDK-owned federation entry", () => {
  it("mount renders the page SCOPED (root + stylesheet under el, never head)", () => {
    const { mount } = defineRemote({
      id: "host-metrics",
      styles: ".x{color:red}",
      page: () => <h1>Host Metrics</h1>,
    });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, ctx, bridge)) as PageHandle;

    const scoped = el.querySelector("[data-ext-root='host-metrics']");
    expect(scoped).not.toBeNull();
    // The page rendered inside the scoped root.
    expect(scoped!.textContent).toContain("Host Metrics");
    // The stylesheet is scoped under the root, NOT in the host head (the leak that shipped before).
    expect(scoped!.querySelector("style[data-ext-styles='host-metrics']")).not.toBeNull();
    expect(document.head.querySelector("style[data-ext-styles]")).toBeNull();

    act(() => handle.teardown!());
    expect(el.querySelector("[data-ext-root]")).toBeNull();
  });

  it("mountWidget dispatches by widgetId", () => {
    const { mountWidget } = defineRemote({
      id: "host-metrics",
      widgets: {
        gauge: () => <span>GAUGE</span>,
        other: () => <span>OTHER</span>,
      },
    });
    const el = document.createElement("div");
    mountAct(() => mountWidget(el, wctx, wbridge, "other") as () => void);
    expect(el.textContent).toContain("OTHER");
    expect(el.textContent).not.toContain("GAUGE");
  });

  it("mountWidget falls back to the first widget for an unknown id", () => {
    const { mountWidget } = defineRemote({
      id: "host-metrics",
      widgets: { gauge: () => <span>GAUGE</span> },
    });
    const el = document.createElement("div");
    mountAct(() => mountWidget(el, wctx, wbridge, "does-not-exist") as () => void);
    expect(el.textContent).toContain("GAUGE");
  });

  it("a page-only ext still gives a working mountWidget (renders nothing, no throw)", () => {
    const { mountWidget } = defineRemote({ id: "x", page: () => <div /> });
    const el = document.createElement("div");
    expect(() => mountAct(() => mountWidget(el, wctx, wbridge, "anything") as () => void)).not.toThrow();
  });

  it("mount returns a { update, teardown } page handle", () => {
    const { mount } = defineRemote({ id: "x", page: () => <div /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, ctx, bridge)) as PageHandle;
    expect(typeof handle.update).toBe("function");
    expect(typeof handle.teardown).toBe("function");
    act(() => handle.teardown!());
  });

  // THE PHASE 0 GATE: N route changes must NOT remount the page. A component that counts its OWN mounts
  // (an empty-dep effect) proves it — `update(ctx)` re-renders in place, so the mount counter stays 1
  // across many route changes while the rendered route tracks each new ctx. If `update` remounted (the
  // trap this whole scope exists to avoid), the counter would climb with every navigation.
  it("update(ctx) re-supplies route WITHOUT remounting (mount runs once across N navigations)", () => {
    let mountCount = 0;
    function Page() {
      const route = useRoute();
      // Empty deps → this fires exactly once per real mount. A remount bumps it; a re-render does not.
      useEffect(() => {
        mountCount += 1;
      }, []);
      return <div data-testid="route">{route || "root"}</div>;
    }

    const { mount } = defineRemote({ id: "ems", page: () => <Page /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, { workspace: "nube", route: "" }, bridge)) as PageHandle;

    const routeText = () => el.querySelector("[data-testid='route']")?.textContent;
    expect(routeText()).toBe("root");
    // Capture the settled mount count (StrictMode may double-invoke the initial mount effect — that is
    // fine; the gate is that navigation adds NO further mounts, so we assert against this baseline).
    const baseline = mountCount;

    for (const r of ["explore", "sites", "sites/site-1", "studio"]) {
      act(() => handle.update!({ workspace: "nube", route: r }));
      expect(routeText()).toBe(r);
      // The decisive assertion: no navigation ever remounts the page — the counter never moves.
      expect(mountCount).toBe(baseline);
    }

    act(() => handle.teardown!());
    expect(el.querySelector("[data-ext-root]")).toBeNull();
  });

  it("preserves in-place component state across update(ctx) (no state loss on nav)", () => {
    // A ref persists only while the component instance lives. If `update` remounted, the ref would reset.
    function Page() {
      const renders = useRef(0);
      renders.current += 1;
      const route = useRoute();
      return <div data-testid="renders">{`${renders.current}:${route}`}</div>;
    }
    const { mount } = defineRemote({ id: "ems", page: () => <Page /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, { workspace: "nube", route: "a" }, bridge)) as PageHandle;
    act(() => handle.update!({ workspace: "nube", route: "b" }));
    // Same instance kept counting (>=2 renders, ending on route "b") — a remount would have reset to "1:b".
    const [renders, route] = (el.querySelector("[data-testid='renders']")?.textContent ?? "").split(":");
    expect(route).toBe("b");
    expect(Number(renders)).toBeGreaterThanOrEqual(2);
    act(() => handle.teardown!());
  });

  it("mountWidget returns a live handle whose update(ctx) re-renders with the NEW ctx", () => {
    // REGRESSION (rubix-ai-extensions docs/debugging/frontend/ext-widget-data-frames-never-reach-the-tile.md).
    // The host mounts a `data = true` v3 tile BEFORE its viz.query frames resolve, then pushes them in
    // via `update(ctx)` — by design, so live data never re-mounts the tile. Two bugs made that a no-op:
    // `mountWidget` returned only `teardown` (so the host had no `update` to call), and its render
    // callback closed over the MOUNT-TIME ctx (so even a delivered update re-rendered the stale one).
    // Net effect: `ctx.data` was frozen empty and every data tile rendered its ABSENT state forever.
    const { mountWidget } = defineRemote({
      id: "nabers",
      widgets: {
        donut: (c: WidgetCtx) => <span>{String(c.data?.[0]?.fields?.[0]?.values?.[0] ?? "absent")}</span>,
      },
    });
    const el = document.createElement("div");

    // Mount with NO data — exactly what the host does before frames land.
    const handle = mountAct(() => mountWidget(el, wctx, wbridge, "donut")) as WidgetHandle;
    expect(el.textContent).toContain("absent");

    // The handle must actually carry `update` — returning a bare teardown is the bug.
    expect(typeof handle?.update).toBe("function");

    // Frames arrive. The tile must now render THEM, not the stale mount-time ctx.
    act(() =>
      handle.update!({
        ...wctx,
        data: [{ refId: "A", fields: [{ name: "rei", values: [0.16] }] }],
      }),
    );
    expect(el.textContent).toContain("0.16");
    expect(el.textContent).not.toContain("absent");

    act(() => handle.teardown!());
  });

  it("a widget's update(ctx) reconciles in place rather than remounting", () => {
    // The same in-place guarantee the page path has: a live data tile must not lose component state on
    // every new sample, or a tile with any internal state resets on every tick.
    function Tile({ ctx }: { ctx: WidgetCtx }) {
      const renders = useRef(0);
      renders.current += 1;
      return <div data-testid="t">{`${renders.current}:${ctx.theme?.accent ?? "-"}`}</div>;
    }
    const { mountWidget } = defineRemote({
      id: "nabers",
      widgets: { donut: (c: WidgetCtx) => <Tile ctx={c} /> },
    });
    const el = document.createElement("div");
    const handle = mountAct(() => mountWidget(el, wctx, wbridge, "donut")) as WidgetHandle;
    act(() => handle.update!({ ...wctx, theme: { accent: "red" } as WidgetCtx["theme"] }));
    const [renders, accent] = (el.querySelector("[data-testid='t']")?.textContent ?? "").split(":");
    expect(accent).toBe("red");
    expect(Number(renders)).toBeGreaterThanOrEqual(2); // a remount would have reset to 1
    act(() => handle.teardown!());
  });
});
