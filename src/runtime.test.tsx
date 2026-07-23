// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";

import { defineRemote } from "./remote.js";
import { useSession, useMcpClient, useCaps, useIsAdmin } from "./runtime.js";
import type { PageBridge, PageCtx } from "./page.js";
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
    const ctx: PageCtx = { workspace: "acme" };
    const bridge: PageBridge = { call: async () => ({}) as never };

    let seen: PageCtx | null = null;
    function Page() {
      seen = useSession<PageCtx>();
      return <div>ok</div>;
    }
    const { mount } = defineRemote({ id: "runtime-session", page: () => <Page /> });
    const el = document.createElement("div");
    mountAct(() => mount(el, ctx, bridge));

    expect(seen).toEqual({ workspace: "acme" });
  });

  it("useMcpClient hands back the host bridge's caps-checked call", async () => {
    const ctx: PageCtx = { workspace: "acme" };
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
    const ctx: PageCtx = { workspace: "acme", caps: ["mcp:ems.access.grant:call"], isAdmin: true };
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
    const ctx: PageCtx = { workspace: "acme" };
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
      workspace: "acme",
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
