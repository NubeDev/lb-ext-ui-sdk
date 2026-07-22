// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";

import { defineRemote } from "./remote.js";
import { ExtPage } from "./ext-page.js";
import type { PageBridge, PageCtx } from "./page.js";

const bridge: PageBridge = { call: async () => ({}) as never };

// See runtime.test.tsx: `createRoot().render()` commits asynchronously, so mounts are wrapped in `act()`.
function mountPage(ctx: PageCtx): HTMLElement {
  const { mount } = defineRemote({
    id: "ext-page-test",
    page: () => (
      <ExtPage title="Sites" workspace="acme" actions={<button>Add</button>}>
        <div data-testid="body">body</div>
      </ExtPage>
    ),
  });
  const el = document.createElement("div");
  act(() => {
    mount(el, ctx, bridge);
  });
  return el;
}

/** The header shape is inline-styled, so we identify a style by its structural fingerprint rather than a
 *  class: `band` is the only one that draws the accent-wash overlay (an absolutely-positioned aria-hidden
 *  div) and can carry a subtitle; slim/breadcrumbs are the flat 56px bars. */
function hasBandWash(el: HTMLElement): boolean {
  return Array.from(el.querySelectorAll("[aria-hidden]")).some((n) =>
    (n as HTMLElement).style.background.includes("linear-gradient(90deg"),
  );
}

describe("/ext-page — header inherits the host's Header-style setting (inherit-only)", () => {
  it("renders the page body and the passed actions regardless of style", () => {
    const el = mountPage({ workspace: "acme", headerStyle: "slim" });
    expect(el.querySelector('[data-testid="body"]')?.textContent).toBe("body");
    expect(el.querySelector("button")?.textContent).toBe("Add");
    expect(el.textContent).toContain("Sites");
    expect(el.textContent).toContain("acme");
  });

  it("defaults to the slim bar when the host threads no headerStyle (flat bar, no band wash)", () => {
    const el = mountPage({ workspace: "acme" });
    expect(hasBandWash(el)).toBe(false);
  });

  it("renders the band shape when the member picked band", () => {
    const el = mountPage({ workspace: "acme", headerStyle: "band" });
    expect(hasBandWash(el)).toBe(true);
  });

  it("renders a flat bar (no band wash) for breadcrumbs", () => {
    const el = mountPage({ workspace: "acme", headerStyle: "breadcrumbs" });
    expect(hasBandWash(el)).toBe(false);
  });
});
