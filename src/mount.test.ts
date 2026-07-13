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
