import { describe, it, expect } from "vitest";
import { defineExtConfig, REACT_EXTERNALS } from "./vite.js";
import { WIDGET_CONTRACT_VERSION } from "./widget.js";

describe("defineExtConfig", () => {
  it("externalises React so the remote resolves the host's single copy", () => {
    const cfg = defineExtConfig() as any;
    for (const spec of REACT_EXTERNALS) {
      expect(cfg.build.rollupOptions.external).toContain(spec);
    }
  });

  it("emits a single remoteEntry.js in ESM lib mode", () => {
    const cfg = defineExtConfig() as any;
    expect(cfg.build.lib.formats).toEqual(["es"]);
    expect(cfg.build.lib.fileName()).toBe("remoteEntry.js");
  });

  it("appends caller externals and keeps CSS split (no leak into host head)", () => {
    const cfg = defineExtConfig({ externals: ["echarts"] }) as any;
    expect(cfg.build.rollupOptions.external).toContain("echarts");
    expect(cfg.build.cssCodeSplit).toBe(true);
  });

  it("honours a custom entry", () => {
    const cfg = defineExtConfig({ entry: "src/main.tsx" }) as any;
    expect(cfg.build.lib.entry).toBe("src/main.tsx");
  });
});

describe("widget contract", () => {
  it("is at v5 (frames-in + theme + targets)", () => {
    expect(WIDGET_CONTRACT_VERSION).toBe(5);
  });
});
