// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { act } from "@testing-library/react";

import { defineRemote } from "./remote.js";
import { ExtPage, type Crumb } from "./ext-page.js";
import type { PageBridge, PageCtx } from "./page.js";

const bridge: PageBridge = { call: async () => ({}) as never };

// See runtime.test.tsx: `createRoot().render()` commits asynchronously, so mounts are wrapped in `act()`.
function mountPage(ctx: PageCtx, opts?: { crumbs?: Crumb[] }): HTMLElement {
  const { mount } = defineRemote({
    id: "ext-page-test",
    page: () => (
      <ExtPage
        title={opts?.crumbs ? undefined : "Sites"}
        crumbs={opts?.crumbs}
        workspace="nube"
        actions={<button>Add</button>}
      >
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

/** The header shape is inline-styled, so identify a style by its structural fingerprint: `band` is the
 *  only one that draws the accent-wash overlay (an absolutely-positioned aria-hidden div). */
function hasBandWash(el: HTMLElement): boolean {
  return Array.from(el.querySelectorAll("[aria-hidden]")).some((n) =>
    (n as HTMLElement).style.background.includes("linear-gradient(90deg"),
  );
}
function toggleButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('button[aria-label="Toggle sidebar"]');
}

describe("/ext-page — header inherits the host's Header chrome (inherit-only)", () => {
  it("renders body + actions and defaults to slim when no headerStyle is threaded", () => {
    const el = mountPage({ workspace: "nube" });
    expect(el.querySelector('[data-testid="body"]')?.textContent).toBe("body");
    expect(el.querySelector("button")?.textContent).toBe("Add");
    expect(el.textContent).toContain("Sites");
    expect(el.textContent).toContain("nube");
    expect(hasBandWash(el)).toBe(false);
  });

  // The scroll contract. The SDK owns the page's ONE scroll region so the header stays pinned and an ext
  // never hand-rolls a second, nested scroller (which, under a scrolling host ancestor, has no bounded
  // height and silently hands the whole page — header included — to the ancestor's scrollbar).
  describe("scroll region (the SDK owns it, so the header pins)", () => {
    it("scrolls the body, not the section: the header is a non-shrinking sibling of the scroller", () => {
      const el = mountPage({ workspace: "nube" });
      const section = el.querySelector("section") as HTMLElement;
      const header = section.querySelector("header") as HTMLElement;
      const body = el.querySelector('[data-testid="body"]')?.parentElement as HTMLElement;

      // The section is the bounded box — it must NOT scroll, or the header scrolls away with the content.
      expect(section.style.overflowY).not.toBe("auto");
      expect(section.style.height).toBe("100%");
      // The header is pinned by being unshrinkable, outside the scroller.
      expect(header.style.flexShrink).toBe("0");
      expect(body.contains(header)).toBe(false);
      // The body is the scroller, and `minHeight: 0` is what lets it actually overflow inside a flex column.
      expect(body.style.overflowY).toBe("auto");
      expect(body.style.minHeight).toBe("0px");
      expect(body.style.flex).toContain("1");
    });
  });

  it("renders the band shape when the member picked band", () => {
    expect(hasBandWash(mountPage({ workspace: "nube", headerStyle: "band" }))).toBe(true);
  });

  it("renders a flat bar (no band wash) for breadcrumbs", () => {
    expect(hasBandWash(mountPage({ workspace: "nube", headerStyle: "breadcrumbs" }))).toBe(false);
  });

  describe("sidebar toggle (honours the Sidebar-button setting + the host callback)", () => {
    it("shows the toggle and calls the host callback when shown + callback provided", () => {
      const onToggleSidebar = vi.fn();
      const el = mountPage({ workspace: "nube", headerStyle: "slim", sidebarToggle: "shown", onToggleSidebar });
      const btn = toggleButton(el);
      expect(btn).not.toBeNull();
      act(() => btn!.click());
      expect(onToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it("omits the toggle when the member set Sidebar button = hidden", () => {
      const el = mountPage({ workspace: "nube", headerStyle: "slim", sidebarToggle: "hidden", onToggleSidebar: vi.fn() });
      expect(toggleButton(el)).toBeNull();
    });

    it("omits the toggle when the host provides no callback (bare preview — nothing to toggle)", () => {
      const el = mountPage({ workspace: "nube", headerStyle: "slim", sidebarToggle: "shown" });
      expect(toggleButton(el)).toBeNull();
    });

    it("the band header never renders a toggle (parity with the host band)", () => {
      const el = mountPage({ workspace: "nube", headerStyle: "band", sidebarToggle: "shown", onToggleSidebar: vi.fn() });
      expect(toggleButton(el)).toBeNull();
    });
  });

  describe("clickable drill breadcrumbs", () => {
    it("renders each crumb; non-last crumbs are buttons that jump to that level", () => {
      const goRoot = vi.fn();
      const el = mountPage(
        { workspace: "nube", headerStyle: "slim" },
        { crumbs: [{ label: "Sites", onClick: goRoot }, { label: "Modbus Demo" }] },
      );
      expect(el.textContent).toContain("Sites");
      expect(el.textContent).toContain("Modbus Demo");
      const sitesBtn = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Sites");
      expect(sitesBtn).toBeTruthy();
      act(() => sitesBtn!.click());
      expect(goRoot).toHaveBeenCalledTimes(1);
    });

    it("the last crumb is the current page (aria-current, not a button)", () => {
      const el = mountPage(
        { workspace: "nube", headerStyle: "slim" },
        { crumbs: [{ label: "Sites", onClick: vi.fn() }, { label: "Modbus Demo" }] },
      );
      const current = el.querySelector('[aria-current="page"]');
      expect(current?.textContent).toBe("Modbus Demo");
      expect(Array.from(el.querySelectorAll("button")).some((b) => b.textContent === "Modbus Demo")).toBe(false);
    });
  });
});
