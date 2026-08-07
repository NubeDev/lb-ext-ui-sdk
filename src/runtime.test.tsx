// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { useEffect } from "react";
import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";

import { defineRemote } from "./remote.js";
import { useSession, useMcpClient, useCaps, useIsAdmin, useNavExpanded } from "./runtime.js";
import type { PageBridge, PageCtx, PageHandle } from "./page.js";
import type { WidgetCtx } from "./widget.js";

// See remote.test.tsx: `createRoot().render()` commits asynchronously, so mounts are wrapped in `act()`.
function mountAct(fn: () => void | (() => void)) {
  let teardown: void | (() => void);
  act(() => {
    teardown = fn();
  });
  return teardown;
}

describe("/runtime — in-page session + MCP hooks fed by defineRemote", () => {
  it("useSession resolves the host ctx inside a mounted remote", () => {
    const ctx: PageCtx = { workspace: "nube" };
    const bridge: PageBridge = { call: async () => ({}) as never };

    let seen: PageCtx | null = null;
    function Page() {
      seen = useSession<PageCtx>();
      return <div>ok</div>;
    }
    const { mount } = defineRemote({ id: "runtime-session", page: () => <Page /> });
    const el = document.createElement("div");
    mountAct(() => mount(el, ctx, bridge));

    expect(seen).toEqual({ workspace: "nube" });
  });

  it("useMcpClient hands back the host bridge's caps-checked call", async () => {
    const ctx: PageCtx = { workspace: "nube" };
    const calls: Array<[string, unknown]> = [];
    const bridge: PageBridge = {
      call: async (tool: string, args?: Record<string, unknown>) => {
        calls.push([tool, args]);
        return { ok: true } as never;
      },
    };

    let call: ReturnType<typeof useMcpClient> | null = null;
    function Page() {
      call = useMcpClient();
      return <div>ok</div>;
    }
    const { mount } = defineRemote({ id: "runtime-mcp", page: () => <Page /> });
    const el = document.createElement("div");
    mountAct(() => mount(el, ctx, bridge));

    const res = await call!<{ ok: boolean }>("modbus.list", { site: "s1" });
    expect(res).toEqual({ ok: true });
    expect(calls).toEqual([["modbus.list", { site: "s1" }]]);
  });

  it("useCaps/useIsAdmin read the host-stamped caller projection", () => {
    // The host (rubix-ai ExtHost) stamps the verified session's caps + its own isAdmin verdict onto
    // the mount ctx; the page reads them synchronously, no probe.
    const ctx: PageCtx = { workspace: "nube", caps: ["mcp:ems.access.grant:call"], isAdmin: true };
    const bridge: PageBridge = { call: async () => ({}) as never };

    let caps: string[] | null = null;
    let admin: boolean | null = null;
    function Page() {
      caps = useCaps();
      admin = useIsAdmin();
      return <div>ok</div>;
    }
    const { mount } = defineRemote({ id: "runtime-caps", page: () => <Page /> });
    const el = document.createElement("div");
    mountAct(() => mount(el, ctx, bridge));

    expect(caps).toEqual(["mcp:ems.access.grant:call"]);
    expect(admin).toBe(true);
  });

  it("useCaps/useIsAdmin fail CLOSED under an old host that omits the fields", () => {
    // Backward-compat: a legacy `{ workspace }`-only ctx (a host predating ui-v0.12.0). caps ⇒ [],
    // isAdmin ⇒ false — an ext hides admin affordances rather than showing them to everyone.
    const ctx: PageCtx = { workspace: "nube" };
    const bridge: PageBridge = { call: async () => ({}) as never };

    let caps: string[] | null = null;
    let admin: boolean | null = null;
    function Page() {
      caps = useCaps();
      admin = useIsAdmin();
      return <div>ok</div>;
    }
    const { mount } = defineRemote({ id: "runtime-caps-legacy", page: () => <Page /> });
    const el = document.createElement("div");
    mountAct(() => mount(el, ctx, bridge));

    expect(caps).toEqual([]);
    expect(admin).toBe(false);
  });

  it("the widget mount ctx carries the same caps/isAdmin projection (parity)", () => {
    // Parity with the page ctx: mountWidget forwards the host-stamped caller projection too, so a
    // panel/ext widget gates consistently with a full page. A widget reads them off ctx directly.
    let seen: WidgetCtx | null = null;
    const ctx: WidgetCtx = {
      v: 4,
      workspace: "nube",
      binding: {},
      options: {},
      caps: ["mcp:ems.access.grant:call"],
      isAdmin: true,
    };
    const bridge = { call: async () => ({}) as never, watch: () => () => {} };
    const { mountWidget } = defineRemote({
      id: "runtime-widget-caps",
      widgets: {
        panel: (wctx) => {
          seen = wctx as WidgetCtx;
          return <div>ok</div>;
        },
      },
    });
    const el = document.createElement("div");
    mountAct(() => mountWidget(el, ctx, bridge, "panel"));

    expect(seen?.caps).toEqual(["mcp:ems.access.grant:call"]);
    expect(seen?.isAdmin).toBe(true);
  });

  // ── `useNavExpanded()` — the host->ext half of lazy nav (ext-nav-lazy-children scope) ─────────────

  it("useNavExpanded reads the host's expanded set and re-supplies it through update(ctx) in place", () => {
    let mountCount = 0;
    let seen: string[] = [];
    function Page() {
      seen = useNavExpanded();
      useEffect(() => {
        mountCount += 1;
      }, []);
      return <div data-testid="n">{seen.join("|") || "none"}</div>;
    }
    const bridge: PageBridge = { call: async () => ({}) as never };
    const { mount } = defineRemote({ id: "lazy-nav", page: () => <Page /> });
    const el = document.createElement("div");
    // THE CASE THAT MOTIVATES THE DESIGN: the user expanded a branch while this page was NOT mounted.
    // Because the signal is a STATE and not an event, the very first ctx already carries it — there is
    // nothing to have missed and nothing to replay.
    const handle = mountAct(() =>
      mount(el, { workspace: "nube", navExpanded: ["networks/plant-a"] }, bridge),
    ) as PageHandle;
    const text = () => el.querySelector("[data-testid='n']")?.textContent;
    expect(text()).toBe("networks/plant-a");
    const baseline = mountCount;

    // A further expand arrives through the live re-supply — in place, NOT a remount (page state, scroll
    // and in-flight fetches all survive, exactly as for `route`).
    act(() => handle.update?.({ workspace: "nube", navExpanded: ["networks/plant-a", "networks/plant-b"] }));
    expect(text()).toBe("networks/plant-a|networks/plant-b");
    expect(mountCount).toBe(baseline);

    // Collapsing everything is just a smaller set.
    act(() => handle.update?.({ workspace: "nube", navExpanded: [] }));
    expect(text()).toBe("none");
    expect(mountCount).toBe(baseline);
  });

  it("useNavExpanded fails safe to a STABLE [] on a host predating lazy nav", () => {
    // An old host omits `ctx.navExpanded`. The ext must not crash, and — because an ext will dep an
    // effect on this — the fallback identity must be stable across renders or every render refetches.
    const seen: string[][] = [];
    function Page() {
      seen.push(useNavExpanded());
      return <div>ok</div>;
    }
    const bridge: PageBridge = { call: async () => ({}) as never };
    const { mount } = defineRemote({ id: "lazy-nav-old-host", page: () => <Page /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, { workspace: "nube" }, bridge)) as PageHandle;
    act(() => handle.update?.({ workspace: "nube", route: "networks" }));

    expect(seen.length).toBeGreaterThan(1);
    expect(seen[0]).toEqual([]);
    // Same array identity every time — safe as a useEffect dep.
    for (const s of seen) expect(s).toBe(seen[0]);
  });

  it("a hook rendered outside a mounted remote throws a programming error", () => {
    // A real component render, but with NO RuntimeProvider above it: reaching for the runtime is a
    // bug, not a runtime condition. React surfaces the error the component threw during commit.
    let thrown: unknown;
    function Bare() {
      useSession();
      return null;
    }
    const el = document.createElement("div");
    const root = createRoot(el);
    try {
      act(() => root.render(<Bare />));
    } catch (e) {
      thrown = e;
    }
    expect(String(thrown)).toMatch(/useSession called outside a mounted extension remote/);
  });
});
