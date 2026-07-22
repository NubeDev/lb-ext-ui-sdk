// `<ExtPage>` — the SDK-owned page shell an extension wraps its surface in, so its header MATCHES the
// host's Header chrome (Settings → Theme → Layout) with zero per-extension work. This closes, for
// extensions, the same drift issue #20 closes for host pages: one place decides the header shape, an ext
// never picks a header itself (inherit-only — from `ctx`, no override), and the member's Header-style /
// Header-line / Sidebar-button choices re-theme every extension page the instant they change.
//
// Why it lives in the SDK, not a rubix-ai `packages/*`: an extension may depend on `@nube/ext-ui-sdk`
// and NOTHING else (zero lb/rubix-ai-repo access). This is the only shipping seam an extension can reach.
//
// Why everything rides on `ctx`: an extension mounts its OWN React root (the SDK scoped mount), so host
// React context never crosses the boundary. `ctx` is the one seam that does — so the header style, the
// divider line, the sidebar-button setting, AND the host's `toggleSidebar` callback are all threaded via
// `PageCtx` and read here through `useSession()`. That is what makes a theme setting actually reach the
// extension header.
//
// Why CSS-var-driven inline styles + inline SVG, not Tailwind classes / a lucide dep: an SDK component's
// utility classes never land in an ext's scanned CSS (`content: ["./src/**"]`), and the SDK doesn't
// bundle an icon set. Reading host tokens (`--background`, `--foreground`, `--border`, `--accent`, …) as
// inline styles and drawing the one glyph (the sidebar `PanelLeft`) as inline SVG keeps the component
// fully self-contained: it themes off the SAME cascaded host vars every ext already inherits, with no ext
// config and no extra dependency. The host owns the tokens; this only consumes them.

import type { CSSProperties, ReactNode } from "react";

import type { HeaderLine, HeaderStyle, SidebarToggle } from "./page.js";
import { useSession } from "./runtime.js";

/** Trailing hairline styles are inline too (see file header). `none` (the default) floats the bar. */
const LINE_BORDER: Record<HeaderLine, CSSProperties> = {
  none: {},
  bottom: { borderBottom: "1px solid hsl(var(--border) / 0.6)" },
  top: { borderTop: "1px solid hsl(var(--border) / 0.6)" },
  both: { borderTop: "1px solid hsl(var(--border) / 0.6)", borderBottom: "1px solid hsl(var(--border) / 0.6)" },
};

/** One clickable step in a drill breadcrumb trail. `onClick` jumps to that level; the LAST crumb (the
 *  current page) omits it and renders as plain text — mirrors the host breadcrumb trail. */
export interface Crumb {
  label: string;
  onClick?: () => void;
}

export interface ExtPageProps {
  /** The page title — rendered as the final trail segment when `crumbs` is omitted. Ignored if `crumbs`
   *  is given (the last crumb IS the title). Provide one of `title` or `crumbs`. */
  title?: string;
  /** A clickable drill trail (`Sites › Site › Node`) for hierarchy pages — rendered IN the host-styled
   *  header, so back-navigation looks and behaves like the host. The last crumb is the current page. */
  crumbs?: Crumb[];
  /** Optional workspace segment prepended to the trail (a plain label — an extension does NOT own host
   *  routing, so it is text, never a link). Omit it and the trail starts at the title/first crumb. */
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

interface HeaderChoice {
  style: HeaderStyle;
  line: HeaderLine;
  sidebarToggle: SidebarToggle;
  onToggleSidebar?: () => void;
}

/** Read the member's header choices + the host sidebar-toggle callback from the mount `ctx` (threaded by
 *  the host through `PageCtx`). Inherit-only: there is no ext override — the values are exactly what the
 *  member picked in Settings → Theme → Layout. Absent axes fall back to the shell defaults. */
function useHeaderChoice(fallback: HeaderStyle): HeaderChoice {
  const session = useSession<{
    headerStyle?: HeaderStyle;
    headerLine?: HeaderLine;
    sidebarToggle?: SidebarToggle;
    onToggleSidebar?: () => void;
  }>();
  return {
    style: session?.headerStyle ?? fallback,
    line: session?.headerLine ?? "none",
    sidebarToggle: session?.sidebarToggle ?? "shown",
    onToggleSidebar: session?.onToggleSidebar,
  };
}

/**
 * The extension page shell. Wrap a surface in it and its header inherits the host's Header chrome:
 *
 *   <ExtPage title="Sites" icon={<Building2 size={16} />} actions={<Button>Add</Button>}>…</ExtPage>
 *
 * A drill page passes a clickable trail instead of a plain title:
 *
 *   <ExtPage crumbs={[{ label: "Sites", onClick: goRoot }, { label: site.name }]}>…</ExtPage>
 *
 * The ext supplies title/crumbs / workspace / icon / actions only; the SDK picks the shape and the
 * sidebar toggle from `ctx`.
 */
export function ExtPage({
  title,
  crumbs,
  workspace,
  icon,
  description,
  actions,
  children,
  fallbackStyle = "slim",
}: ExtPageProps) {
  const { style, line, sidebarToggle, onToggleSidebar } = useHeaderChoice(fallbackStyle);
  // The trail the header renders: an explicit `crumbs` wins; otherwise a single-step trail from `title`.
  const trail: Crumb[] = crumbs ?? [{ label: title ?? "" }];
  // The toggle button shows only when the member left it `shown` AND the host actually provided a toggle
  // callback (nothing to toggle in a bare preview) — exactly the host slim header's condition.
  const toggle = sidebarToggle === "shown" ? onToggleSidebar : undefined;
  return (
    <section
      style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}
    >
      <ExtHeader style={style} line={line} trail={trail} workspace={workspace} icon={icon} description={description} actions={actions} onToggleSidebar={toggle} />
      <div style={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>{children}</div>
    </section>
  );
}

interface ExtHeaderProps {
  style: HeaderStyle;
  line: HeaderLine;
  trail: Crumb[];
  workspace?: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
  /** When present, the slim/breadcrumbs header renders the sidebar toggle button that calls it. */
  onToggleSidebar?: () => void;
}

/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export function ExtHeader({ style, line, trail, workspace, icon, description, actions, onToggleSidebar }: ExtHeaderProps) {
  if (style === "band") return <BandHeader trail={trail} workspace={workspace} icon={icon} description={description} actions={actions} />;
  if (style === "breadcrumbs") return <BreadcrumbsHeader line={line} trail={trail} workspace={workspace} icon={icon} actions={actions} onToggleSidebar={onToggleSidebar} />;
  return <SlimHeader line={line} trail={trail} workspace={workspace} actions={actions} onToggleSidebar={onToggleSidebar} />;
}

/** The sidebar minimise/expand button — the host slim header's `SidebarTrigger`, matched: a ghost icon
 *  button drawing the lucide `PanelLeft` glyph as inline SVG (the SDK ships no icon set), then a vertical
 *  rule. Rendered only when the host provided a toggle callback. */
function SidebarToggleButton({ onToggle }: { onToggle: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        style={{ display: "inline-flex", height: 28, width: 28, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "calc(var(--radius) - 4px)", border: "none", background: "transparent", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
      <span aria-hidden style={{ height: 20, width: 1, flexShrink: 0, background: "hsl(var(--border))" }} />
    </>
  );
}

/** Shared trailing cluster: the actions the ext passed. (No Settings gear — routing to host settings is
 *  the HOST chrome's job, outside the ext mount; an ext must not fabricate a host route.) */
function Actions({ actions }: { actions?: ReactNode }) {
  return <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>{actions}</div>;
}

/** The workspace + clickable breadcrumb trail, mirroring the host breadcrumb trail. The workspace is a
 *  plain label (an ext does not own the host address bar); each non-last crumb with an `onClick` is a
 *  button that jumps to that level; the last crumb is the current page (plain, `aria-current`). */
function Trail({ workspace, trail }: { workspace?: string; trail: Crumb[] }) {
  const sep = (
    <span aria-hidden style={{ color: "hsl(var(--muted-foreground))", padding: "0 2px" }}>/</span>
  );
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, minWidth: 0 }}>
      {workspace ? (
        <>
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{workspace}</span>
          {sep}
        </>
      ) : null}
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            {i > 0 ? sep : null}
            {last || !c.onClick ? (
              <span aria-current={last ? "page" : undefined} style={{ fontWeight: last ? 600 : 400, letterSpacing: last ? "-0.01em" : undefined, color: last ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={c.onClick}
                style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", color: "hsl(var(--muted-foreground))", font: "inherit" }}
              >
                {c.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** `slim` — the shadcn-admin compact bar (the host default). One flat h-14 bar: the sidebar toggle (when
 *  the host provides one and the member left it shown), the trail, then actions. No icon chip, no wash. */
function SlimHeader({ line, trail, workspace, actions, onToggleSidebar }: { line: HeaderLine; trail: Crumb[]; workspace?: string; actions?: ReactNode; onToggleSidebar?: () => void }) {
  return (
    <header style={{ display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 8, padding: "0 12px", ...LINE_BORDER[line] }}>
      {onToggleSidebar ? <SidebarToggleButton onToggle={onToggleSidebar} /> : null}
      <Trail workspace={workspace} trail={trail} />
      <Actions actions={actions} />
    </header>
  );
}

/** `breadcrumbs` — the minimal trail with a small muted glyph anchor (parity with the host breadcrumbs
 *  header): the sidebar toggle (same condition as slim), the anchor + trail, then actions. */
function BreadcrumbsHeader({ line, trail, workspace, icon, actions, onToggleSidebar }: { line: HeaderLine; trail: Crumb[]; workspace?: string; icon?: ReactNode; actions?: ReactNode; onToggleSidebar?: () => void }) {
  return (
    <header style={{ display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 12, padding: "0 16px", ...LINE_BORDER[line] }}>
      {onToggleSidebar ? <SidebarToggleButton onToggle={onToggleSidebar} /> : null}
      {icon ? <span aria-hidden style={{ display: "inline-flex", flexShrink: 0, color: "hsl(var(--muted-foreground))" }}>{icon}</span> : null}
      <Trail workspace={workspace} trail={trail} />
      <Actions actions={actions} />
    </header>
  );
}

/** `band` — the tall icon-chip header: an accent-tinted chip + title/subtitle, the accent wash and the
 *  two-hue signature hairline. Mirrors the host band shape (`min-h-[3.75rem]`). The band header has no
 *  sidebar toggle (parity with the host — the band pairs with the sidebar, which owns its own edge rail).
 *  Its "title" is the LAST crumb; earlier crumbs render as the muted trail prefix. */
function BandHeader({ trail, workspace, icon, description, actions }: { trail: Crumb[]; workspace?: string; icon?: ReactNode; description?: string; actions?: ReactNode }) {
  const last = trail[trail.length - 1];
  const prefix = trail.slice(0, -1);
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
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
          {workspace ? <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{workspace} /</span> : null}
          {prefix.map((c, i) => (
            <span key={i} style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
              {c.onClick ? (
                <button type="button" onClick={c.onClick} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", color: "inherit", font: "inherit" }}>{c.label}</button>
              ) : c.label}
              {" /"}
            </span>
          ))}
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last?.label}</span>
        </div>
        {description ? <p style={{ margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{description}</p> : null}
      </div>
      <Actions actions={actions} />
    </header>
  );
}
