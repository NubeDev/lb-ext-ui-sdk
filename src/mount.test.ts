// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mountScoped } from "./mount.js";
import { extTailwindPreset, EXT_ROOT_ATTR } from "./tailwind.js";

describe("mountScoped — CSS isolation", () => {
  it("wraps content in a scoped root inside el, NEVER document.head", () => {
    const el = document.createElement("div");
    const teardown = mountScoped(el, { id: "proof-panel", styles: ".x{color:red}" }, (root) => {
      root.appendChild(document.createElement("span"));
    });
    const scoped = el.querySelector("[data-ext-root='proof-panel']");
    expect(scoped).not.toBeNull();
    expect(scoped!.querySelector("span")).not.toBeNull();
    // The stylesheet lives UNDER the scoped root, not in the host head.
    expect(scoped!.querySelector("style[data-ext-styles='proof-panel']")).not.toBeNull();
    expect(document.head.querySelector("style[data-ext-styles]")).toBeNull();
    teardown();
  });

  it("teardown removes the scoped root (and its styles) and runs the render teardown", () => {
    const el = document.createElement("div");
    let torn = false;
    const teardown = mountScoped(el, { id: "x", styles: ".a{}" }, () => () => {
      torn = true;
    });
    expect(el.querySelector("[data-ext-root]")).not.toBeNull();
    teardown();
    expect(torn).toBe(true);
    expect(el.querySelector("[data-ext-root]")).toBeNull();
    expect(el.querySelector("style")).toBeNull();
  });

  it("omitting styles attaches no <style>", () => {
    const el = document.createElement("div");
    mountScoped(el, { id: "x" }, () => {});
    expect(el.querySelector("style")).toBeNull();
  });

  // The portal-container contract. Radix defaults overlay content to `document.body`, which is OUTSIDE
  // the scoped root — so every `[data-ext-root]`-scoped utility fails to match and the overlay renders
  // unstyled. `mountScoped` hands the root back so the caller can portal INSIDE the scope instead.
  describe("the scoped root is handed to the render (portal container)", () => {
    it("passes the scoped root as the second argument, distinct from the mount node", () => {
      const el = document.createElement("div");
      let mountNode: HTMLElement | null = null;
      let rootNode: HTMLElement | null = null;
      mountScoped(el, { id: "esr", styles: ".x{}" }, (mount, root) => {
        mountNode = mount;
        rootNode = root;
      });

      expect(rootNode).not.toBeNull();
      // It IS the scoped root — the element carrying the attribute the CSS is scoped under.
      expect(rootNode!.getAttribute("data-ext-root")).toBe("esr");
      // And it is NOT the React container: `createRoot` clears its container, which would wipe the
      // sibling <style>. The two must stay distinct.
      expect(mountNode).not.toBe(rootNode);
      expect(rootNode!.contains(mountNode!)).toBe(true);
    });

    it("portalling into the root keeps content inside the CSS scope", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      let portalTarget: HTMLElement | null = null;
      mountScoped(el, { id: "esr" }, (_mount, root) => {
        portalTarget = root;
      });

      // What a Radix `container={usePortalContainer()}` does: append overlay content to the root.
      const overlay = document.createElement("div");
      portalTarget!.appendChild(overlay);

      // The property every scoped utility depends on. Appending to `document.body` instead — the
      // Radix default — makes this false, and the overlay renders completely unstyled.
      expect(overlay.closest("[data-ext-root]")).toBe(portalTarget);
      el.remove();
    });

    it("the root imposes no overflow, so a portal still escapes clipping", () => {
      // The reason portalling into the root is safe rather than a regression: Radix portals to escape
      // an ancestor's `overflow`. The scoped root sets only `h-full w-full` — no overflow of its own —
      // so content portalled into it is still free of the page's clipping context.
      const el = document.createElement("div");
      let rootNode: HTMLElement | null = null;
      mountScoped(el, { id: "esr" }, (_m, root) => {
        rootNode = root;
      });
      expect(rootNode!.style.overflow).toBe("");
      expect(rootNode!.className).toBe("h-full w-full");
    });
  });
});

describe("extTailwindPreset — non-leaky compiled CSS", () => {
  it("disables Preflight (no global reset emitted)", () => {
    const p = extTailwindPreset() as any;
    expect(p.corePlugins.preflight).toBe(false);
  });

  it("scopes every utility under the ext root via selector-string `important`", () => {
    const p = extTailwindPreset() as any;
    expect(p.important).toBe(`[${EXT_ROOT_ATTR}]`);
    expect(EXT_ROOT_ATTR).toBe("data-ext-root");
  });
});
