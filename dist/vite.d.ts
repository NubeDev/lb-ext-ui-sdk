/** The React module specifiers an extension remote MUST externalise (resolved by the host import map). */
export declare const REACT_EXTERNALS: readonly ["react", "react-dom", "react-dom/client", "react/jsx-runtime"];
export interface ExtConfigOptions {
    /** The remote's entry module (default `src/remoteEntry.ts`). */
    entry?: string;
    /** Extra module specifiers to externalise beyond React. */
    externals?: string[];
}
/** Build the Vite config fragment for an extension UI remote: lib-mode ESM `remoteEntry.js` with React
 *  (and any extras) externalised. Spread into `defineConfig`. */
export declare function defineExtConfig(options?: ExtConfigOptions): Record<string, unknown>;
//# sourceMappingURL=vite.d.ts.map