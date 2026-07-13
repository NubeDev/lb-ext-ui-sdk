// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";

import { defineRemote } from "./remote.js";
import { useSession, useMcpClient } from "./runtime.js";
import type { PageBridge, PageCtx } from "./page.js";

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
