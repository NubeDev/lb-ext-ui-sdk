// `defineExtConfig()` — the Vite build preset for an extension UI remote.
//
// Every extension `ui/` builds in lib mode to a single `remoteEntry.js`, externalising React so its
// bare imports resolve through the host import map to the shell's ONE React (the rubix-cube pattern,
// NOT @originjs/vite-plugin-federation — that shipped a second React and broke hooks). This preset
// encodes that so an extension author never hand-wires `external` / `output` again.
//
// It returns a plain object (Vite's `UserConfig` shape) with no dependency on `vite` itself, so this
// package stays dependency-free; an extension spreads it into its own `defineConfig({ ...ext })`.
/** The React module specifiers an extension remote MUST externalise (resolved by the host import map). */
export const REACT_EXTERNALS = [
    "react",
    "react-dom",
    "react-dom/client",
    "react/jsx-runtime",
];
/** Build the Vite config fragment for an extension UI remote: lib-mode ESM `remoteEntry.js` with React
 *  (and any extras) externalised. Spread into `defineConfig`. */
export function defineExtConfig(options = {}) {
    const entry = options.entry ?? "src/remoteEntry.ts";
    const external = [...REACT_EXTERNALS, ...(options.externals ?? [])];
    return {
        build: {
            lib: {
                entry,
                formats: ["es"],
                fileName: () => "remoteEntry.js",
            },
            rollupOptions: { external },
            // Keep the extension's CSS out of the host: emit its own stylesheet, never inline into <head>.
            cssCodeSplit: true,
        },
    };
}
//# sourceMappingURL=vite.js.map