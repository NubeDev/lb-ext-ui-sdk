import { describe, it, expect } from "vitest";
import { extTailwindPreset, EXT_ROOT_ATTR } from "./tailwind.js";

describe("extTailwindPreset — isolation + canonical semantic colours", () => {
  const preset = extTailwindPreset() as any;

  it("drops Preflight and scopes utilities under the ext root", () => {
    expect(preset.corePlugins.preflight).toBe(false);
    expect(preset.important).toBe(`[${EXT_ROOT_ATTR}]`);
  });

  it("binds every semantic colour to a host CSS var (with a dev-preview fallback)", () => {
    const c = preset.theme.extend.colors;
    for (const key of ["border", "background", "foreground", "card", "muted", "accent", "destructive"]) {
      expect(JSON.stringify(c[key])).toContain("var(--");
    }
  });

  it("maps `accent` to the host neutral hover surface (--muted-bg), NOT the brand --accent", () => {
    // This is the fix for the "black hover" bug: shadcn's `hover:bg-accent` must read as a subtle grey,
    // but the host repurposed --accent as the brand colour. `accent` therefore binds to --muted-bg.
    expect(preset.theme.extend.colors.accent.DEFAULT).toContain("--muted-bg");
    expect(preset.theme.extend.colors.accent.DEFAULT).not.toContain("--accent");
  });

  it("exposes the host brand colour separately as `brand` (→ --accent) for spots that want the fill", () => {
    expect(preset.theme.extend.colors.brand.DEFAULT).toContain("var(--accent");
    expect(preset.theme.extend.colors.brand.foreground).toContain("--accent-foreground");
  });

  it("muted SURFACE is --muted-bg, not the host --muted mid-grey foreground", () => {
    expect(preset.theme.extend.colors.muted.DEFAULT).toContain("--muted-bg");
  });
});
