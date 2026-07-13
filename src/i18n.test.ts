// i18n seam tests: locale resolution chain, translation fallback, interpolation, parity gate.
import { describe, expect, it } from "vitest";
import { catalogParity, makeTranslator, resolveLocale } from "./i18n.js";

const CATALOGS = {
  en: { "login.title": "Sign in", "hello.user": "Welcome, {name}!" },
  es: { "login.title": "Iniciar sesión", "hello.user": "¡Bienvenido, {name}!" },
};

describe("resolveLocale", () => {
  it("prefers the user pref when it is shipped", () => {
    expect(resolveLocale("es", ["en", "es"])).toBe("es");
  });
  it("ignores an unshipped pref and falls to navigator.language base then en", () => {
    // jsdom's navigator.language is en-US → base "en".
    expect(resolveLocale("fr", ["en", "es"])).toBe("en");
    expect(resolveLocale(null, ["en", "es"])).toBe("en");
  });
});

describe("makeTranslator", () => {
  it("translates in the bound locale with args", () => {
    const t = makeTranslator(CATALOGS, "es");
    expect(t("login.title")).toBe("Iniciar sesión");
    expect(t("hello.user", { name: "Ana" })).toBe("¡Bienvenido, Ana!");
  });
  it("falls back locale → en → key literal, and never blanks a missing arg", () => {
    const t = makeTranslator({ en: CATALOGS.en }, "es");
    expect(t("login.title")).toBe("Sign in"); // en fallback
    expect(t("nope.key")).toBe("nope.key"); // key literal
    expect(t("hello.user")).toBe("Welcome, [name]!"); // missing arg marked, not blank
  });
});

describe("catalogParity", () => {
  it("passes on identical key sets", () => {
    expect(catalogParity(CATALOGS)).toEqual([]);
  });
  it("reports keys missing on either side", () => {
    const problems = catalogParity({
      en: { a: "A", b: "B" },
      es: { a: "A", c: "C" },
    });
    expect(problems.some((p) => p.includes("es: missing key 'b'"))).toBe(true);
    expect(problems.some((p) => p.includes("en: missing key 'c'"))).toBe(true);
  });
});
