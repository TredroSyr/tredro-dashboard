"use client";

import type { ReactNode } from "react";
import { ArrowRight, Maximize2, Minimize2, Search } from "lucide-react";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { cn } from "@/lib/utils";

/**
 * Map-app building blocks shared by the rep tracking tab and the all-reps
 * page: one framed panel with a list (or a detail view) on the start side and
 * the map beside it. Colors come from the dashboard tokens, so light/dark just work.
 */

// Tredro blue + beige family.
const AVATAR_TONES = [
  { bg: "#f4f4f5", fg: "#1e293b" },
  { bg: "#efe3cf", fg: "#4a3412" },
  { bg: "#dbe7fb", fg: "#123a7a" },
  { bg: "#e3cfa8", fg: "#3f2b0c" },
  { bg: "#b9cff7", fg: "#0b2a5c" },
  { bg: "#e4e4e7", fg: "#27272a" },
];

const NAME_PREFIXES = /^(سوبر\s*ماركت|سوبرماركت|ماركت|بقالية|محلات|محل|مول|مؤسسة|شركة)\s+/;

export function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** "سوبر ماركت أبو أحمد" → "أ": the letter people would recognise the shop by. */
export function avatarLetter(name: string) {
  const core = name.trim().replace(NAME_PREFIXES, "").replace(/^(أبو|ابو|أم|ام)\s+/, "").trim();
  // Skip the article: "الزهراء" reads as "ز", not "ا".
  const word = core.startsWith("ال") && core.length > 3 ? core.slice(2) : core;
  return (word || name.trim()).charAt(0);
}

export const compactNumber = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function TkAvatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  const tone = avatarTone(name);
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-bold ring-1 ring-black/5", className)}
      style={{ width: size, height: size, background: tone.bg, color: tone.fg, fontSize: size * 0.4 }}
    >
      {avatarLetter(name)}
    </span>
  );
}

/** List/detail on the start side, map on the other; `expanded` hands the whole frame to the map. */
export function TkFrame({ children, expanded, className }: { children: ReactNode; expanded?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "tk-frame grid grid-cols-1 overflow-hidden rounded-[28px] border border-border bg-card text-foreground shadow-sm",
        !expanded && "lg:grid-cols-[minmax(320px,370px)_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TkSidebar({ children, hidden, className }: { children: ReactNode; hidden?: boolean; className?: string }) {
  if (hidden) return null;
  return <aside className={cn("order-2 flex min-h-0 flex-col lg:order-1", className)}>{children}</aside>;
}

export function TkMapArea({
  children,
  expanded,
  onToggleExpand,
  className,
}: {
  children: ReactNode;
  expanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative order-1 min-h-[360px] overflow-hidden bg-muted lg:order-2",
        !expanded && "lg:rounded-s-[28px]",
        className,
      )}
    >
      {children}
      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="absolute top-4 left-4 z-[1000] hidden size-10 place-items-center rounded-xl border border-border bg-card/95 text-foreground shadow-md backdrop-blur transition-colors hover:text-primary lg:grid"
          aria-label={expanded ? "إظهار القائمة" : "تكبير الخريطة"}
          title={expanded ? "إظهار القائمة" : "تكبير الخريطة"}
        >
          {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      )}
    </div>
  );
}

export function TkSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3.5 transition-colors focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-primary/10">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Search className="size-4 shrink-0 text-muted-foreground" />
    </label>
  );
}

/** Labelled SearchableSelect, sized to sit in the sidebar's filter row. */
export function TkSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <SearchableSelect
        options={options}
        value={value}
        onChange={(v) => onChange(v as T)}
        searchPlaceholder="ابحث..."
        className="h-10 rounded-lg text-[13px]"
      />
    </div>
  );
}

export function TkPillButton({
  children,
  onClick,
  active,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 shrink-0 items-center gap-1.5 self-end rounded-lg border px-3 text-[13px] transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

/** Scrollable list whose last rows fade out, like a sheet running off the panel. */
export function TkList({ children, listRef }: { children: ReactNode; listRef?: React.Ref<HTMLUListElement> }) {
  return (
    <ul ref={listRef} className="tk-list min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pt-1 pb-10">
      {children}
    </ul>
  );
}

export function TkRow({
  selected,
  muted,
  onClick,
  index,
  children,
  dataId,
}: {
  selected?: boolean;
  muted?: boolean;
  onClick?: () => void;
  index: number;
  children: ReactNode;
  dataId?: string;
}) {
  return (
    <li data-row={dataId} className="tk-row-enter" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-[background,border-color,box-shadow,opacity] duration-200",
          selected
            ? "border-primary bg-primary/5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_14%,transparent)]"
            : "border-transparent hover:bg-muted/60",
          muted && !selected && "opacity-50 hover:opacity-90",
        )}
      >
        {children}
      </div>
    </li>
  );
}

/** Small outline hexagon with a number, the trailing marker on each row. */
export function TkHex({ children, title, active }: { children: ReactNode; title?: string; active?: boolean }) {
  return (
    <span
      className={cn("relative grid size-[22px] shrink-0 place-items-center", active ? "text-primary" : "text-muted-foreground")}
      title={title}
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z" strokeLinejoin="round" />
      </svg>
      <span className="relative text-[9px] leading-none font-bold tabular-nums">{children}</span>
    </span>
  );
}

/* ---------- Detail view (replaces the list when something is opened) ---------- */

export function TkDetail({
  onBack,
  backLabel,
  name,
  sub,
  stats,
  title,
  children,
  action,
}: {
  onBack: () => void;
  backLabel: string;
  name: string;
  sub: ReactNode;
  stats: { icon: ReactNode; label: string; value: string; tone?: string }[];
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="tk-detail-in flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="size-4" />
          {backLabel}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <TkAvatar name={name} size={52} />
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{name}</div>
            <div className="truncate text-xs text-muted-foreground">{sub}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-2xl border border-border">
          {stats.map((s, i) => (
            <div key={i} className="min-w-0 px-2 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground [&>svg]:size-3.5">
                {s.icon}
                {s.label}
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold tabular-nums" style={s.tone ? { color: s.tone } : undefined}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        {title && <div className="mt-4 text-[15px] leading-snug font-semibold">{title}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4">{children}</div>
      {action && <div className="border-t border-border p-4">{action}</div>}
    </div>
  );
}

/** Vertical timeline for the detail view; items can be clickable. */
export function TkTimeline({
  items,
}: {
  items: { key: string; icon: ReactNode; title: ReactNode; meta?: ReactNode; tone?: string; active?: boolean; onClick?: () => void }[];
}) {
  return (
    <ol className="relative">
      {items.map((item, i) => (
        <li key={item.key} className="relative">
          {i < items.length - 1 && <span className="absolute top-9 bottom-0 right-[17px] w-px bg-border" />}
          <button
            type="button"
            onClick={item.onClick}
            disabled={!item.onClick}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl px-1 py-2 text-right transition-colors",
              item.onClick && "hover:bg-muted/60",
              item.active && "bg-primary/5",
            )}
          >
            <span
              className="relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full bg-muted [&>svg]:size-3.5"
              style={{ color: item.tone ?? "var(--primary)" }}
            >
              {item.icon}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="block truncate text-sm">{item.title}</span>
              {item.meta && <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export const tkButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90 hover:no-underline";
