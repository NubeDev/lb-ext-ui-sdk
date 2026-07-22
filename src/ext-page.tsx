// `<ExtPage>` — the SDK-owned page shell an extension wraps its surface in, so its header MATCHES the
// host's Header-style setting (Settings → Theme → Layout) with zero per-extension work. This closes, for
// extensions, the same drift issue #20 closes for host pages: one place decides the header shape, an ext
// never picks a header itself (inherit-only — `ctx.headerStyle`, no override), and a member's slim/band/
// breadcrumbs choice re-themes every extension page the instant it changes.
//
// Why it lives in the SDK, not in a rubix-ai `packages/*`: an extension may depend on `@nube/ext-ui-sdk`
// and NOTHING else (zero lb/rubix-ai-repo access). This is the only shipping seam an extension can reach.
//
// Why CSS-var-driven inline styles, not Tailwind utility classes: the classes an SDK component emits live
// in the SDK's compiled `dist/` JS, which an extension's Tailwind build (`content: ["./src/**"]`) never
// scans — so `bg-background`/`border-border` would compile to NOTHING in the ext's CSS. Reading the host
// tokens (`--background`, `--foreground`, `--border`, …) directly as inline styles makes the component
// self-contained: it themes off the SAME cascaded host vars every ext already inherits, with no ext config
// and no dependency on the ext's utility build. The host owns the tokens; this only consumes them.

import type { CSSProperties, ReactNode } from "react";

import type { HeaderLine, HeaderStyle } from "./page.js";
import { useSession } from "./runtime.js";

/** Trailing hairline classes are inline too (see file header). `none` (the default) floats the bar. */
const LINE_BORDER: Record<HeaderLine, CSSProperties> = {
  none: {},
  bottom: { borderBottom: "1px solid hsl(var(--border) / 0.6)" },
  top: { borderTop: "1px solid hsl(var(--border) / 0.6)" },
  both: { borderTop: "1px solid hsl(var(--border) / 0.6)", borderBottom: "1px solid hsl(var(--border) / 0.6)" },
};

export interface ExtPageProps {
  /** The page title — rendered in the header trail / band. */
  title: string;
  /** Optional workspace segment (a plain label — an extension does NOT own host routing, so it is text,
   *  never a link). Omit it and the trail is just the title. */
  workspace?: string;
  /** Optional surface glyph (the ext brings its own icon element — the SDK stays icon-library-agnostic).
   *  Rendered as the band's chip / the breadcrumbs anchor; the slim header omits it (parity with host). */
  icon?: ReactNode;
  /** Optional subtitle — shown only by the `band` style (parity with the host band header). */
  description?: string;
  /** Trailing header controls (buttons, filters). Rendered in the actions slot of every style. */
  actions?: ReactNode;
  /** The page body. Fills the remaining height under the header. */
  children: ReactNode;
  /** Escape hatch for a host that mounts without threading `headerStyle` (a bare dev preview). Ignored
   *  when `ctx.headerStyle` is present — the member's choice always wins (inherit-only). Defaults `slim`. */
  fallbackStyle?: HeaderStyle;
}

/** Read the member's header choice from the mount `ctx` (threaded by the host through `PageCtx`). The
 *  session type carries the optional axes; absent ⇒ the shell defaults. Inherit-only: there is no ext
 *  override — the value is exactly what the member picked in Settings → Theme → Layout. */
function useHeaderChoice(fallback: HeaderStyle): { style: HeaderStyle; line: HeaderLine } {
  const session = useSession<{ headerStyle?: HeaderStyle; headerLine?: HeaderLine }>();
  return {
    style: session?.headerStyle ?? fallback,
    line: session?.headerLine ?? "none",
  };
}

/**
 * The extension page shell. Wrap a surface in it and its header inherits the host's Header-style setting:
 *
 *   <ExtPage title="Sites" icon={<Building2 size={16} />} actions={<Button>Add</Button>}>
 *     …page body…
 *   </ExtPage>
 *
 * The ext supplies title / workspace / icon / actions only; the SDK picks the header shape from `ctx`.
 */
export function ExtPage({
  title,
  workspace,
  icon,
  description,
  actions,
  children,
  fallbackStyle = "slim",
}: ExtPageProps) {
  const { style, line } = useHeaderChoice(fallbackStyle);
  return (
    <section
      style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}
    >
      <ExtHeader style={style} line={line} title={title} workspace={workspace} icon={icon} description={description} actions={actions} />
      <div style={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>{children}</div>
    </section>
  );
}

interface ExtHeaderProps {
  style: HeaderStyle;
  line: HeaderLine;
  title: string;
  workspace?: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export function ExtHeader({ style, line, title, workspace, icon, description, actions }: ExtHeaderProps) {
  if (style === "band") return <BandHeader title={title} workspace={workspace} icon={icon} description={description} actions={actions} />;
  if (style === "breadcrumbs") return <BreadcrumbsHeader line={line} title={title} workspace={workspace} icon={icon} actions={actions} />;
  return <SlimHeader line={line} title={title} workspace={workspace} actions={actions} />;
}

/** Shared trailing cluster: the actions the ext passed. (No Settings gear — routing to host settings is
 *  the HOST chrome's job, outside the ext mount; an ext must not fabricate a host route.) */
function Actions({ actions }: { actions?: ReactNode }) {
  return <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>{actions}</div>;
}

/** The workspace / title trail, mirroring the host breadcrumb trail as plain text (the workspace is a
 *  label here, not a link — an ext does not own the host address bar). */
function Trail({ workspace, title }: { workspace?: string; title: string }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      {workspace ? (
        <>
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{workspace}</span>
          <span aria-hidden style={{ color: "hsl(var(--muted-foreground))" }}>/</span>
        </>
      ) : null}
      <span style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))" }}>{title}</span>
    </nav>
  );
}

/** `slim` — the shadcn-admin compact bar (the host default). One flat h-14 bar: the trail, then actions.
 *  No icon chip, no wash, no subtitle. There is no sidebar trigger here — the sidebar is host chrome that
 *  lives OUTSIDE the ext mount, so an ext header has nothing to toggle. */
function SlimHeader({ line, title, workspace, actions }: { line: HeaderLine; title: string; workspace?: string; actions?: ReactNode }) {
  return (
    <header style={{ display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 8, padding: "0 12px", ...LINE_BORDER[line] }}>
      <Trail workspace={workspace} title={title} />
      <Actions actions={actions} />
    </header>
  );
}

/** `breadcrumbs` — the minimal trail with a small muted glyph anchor (parity with the host breadcrumbs
 *  header): just the trail + actions, no chip or wash. */
function BreadcrumbsHeader({ line, title, workspace, icon, actions }: { line: HeaderLine; title: string; workspace?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <header style={{ display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 12, padding: "0 16px", ...LINE_BORDER[line] }}>
      {icon ? <span aria-hidden style={{ display: "inline-flex", flexShrink: 0, color: "hsl(var(--muted-foreground))" }}>{icon}</span> : null}
      <Trail workspace={workspace} title={title} />
      <Actions actions={actions} />
    </header>
  );
}

/** `band` — the tall icon-chip header: an accent-tinted chip + title/subtitle, the accent wash and the
 *  two-hue signature hairline. Mirrors the host band shape (`min-h-[3.75rem]`). */
function BandHeader({ title, workspace, icon, description, actions }: { title: string; workspace?: string; icon?: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <header style={{ position: "relative", display: "flex", minHeight: "3.75rem", alignItems: "center", gap: 12, padding: "10px 16px", background: "hsl(var(--card) / 0.6)" }}>
      {/* The accent wash rising from the title side, and the two-hue signature hairline — the same
          committed band the host renders, so an ext page reads as THIS product at the `band` setting. */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.09), hsl(var(--accent-2) / 0.04) 32%, transparent 60%)" }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.6), hsl(var(--accent-2) / 0.4) 34%, hsl(var(--border)) 72%)" }} />
      {icon ? (
        <div style={{ position: "relative", display: "flex", height: 36, width: 36, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "calc(var(--radius) - 2px)", border: "1px solid hsl(var(--accent) / 0.25)", color: "hsl(var(--accent))", background: "linear-gradient(135deg, hsl(var(--accent) / 0.16), hsl(var(--accent-2) / 0.10))" }}>
          {icon}
        </div>
      ) : null}
      <div style={{ position: "relative", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          {workspace ? <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{workspace} /</span> : null}
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        </div>
        {description ? <p style={{ margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{description}</p> : null}
      </div>
      <Actions actions={actions} />
    </header>
  );
}
