import { describe, expect, it } from "vitest";
import { hostLink } from "./hostLink.js";

describe("hostLink", () => {
  it("builds the canonical hash route with no vars", () => {
    expect(hostLink({ workspace: "acme", dashboard: "ems-meter-detail" })).toBe(
      "#/t/acme/dashboards/ems-meter-detail",
    );
  });

  it("preselects a single variable as a flat var- param", () => {
    expect(
      hostLink({
        workspace: "acme",
        dashboard: "ems-meter-detail",
        vars: { meter: "mtr-hq-main" },
      }),
    ).toBe("#/t/acme/dashboards/ems-meter-detail?var-meter=mtr-hq-main");
  });

  it("repeats the param for a multi-value selection", () => {
    expect(
      hostLink({
        workspace: "acme",
        dashboard: "d",
        vars: { site: ["site-hq", "site-plant"] },
      }),
    ).toBe("#/t/acme/dashboards/d?var-site=site-hq&var-site=site-plant");
  });

  it("drops empty values and empty arrays", () => {
    expect(
      hostLink({
        workspace: "acme",
        dashboard: "d",
        vars: { a: "", b: [], meter: "m1" },
      }),
    ).toBe("#/t/acme/dashboards/d?var-meter=m1");
  });

  it("url-encodes workspace, dashboard, var name and value", () => {
    expect(
      hostLink({
        workspace: "a c",
        dashboard: "d/e",
        vars: { "na me": "v&x" },
      }),
    ).toBe("#/t/a%20c/dashboards/d%2Fe?var-na%20me=v%26x");
  });
});
