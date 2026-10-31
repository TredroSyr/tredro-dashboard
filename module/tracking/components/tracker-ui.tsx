"use client";

import type { ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark "map app" building blocks shared by the rep tracking tab and the
 * all-reps page: one framed panel with a list on the start side and the map.
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
      className={cn("grid shrink-0 place-items-center rounded-full font-bold shadow-[inset_0_0_0_1px_var(--tk-line)]", className)}
      style={{ width: size, height: size, background: tone.bg, color: tone.fg, fontSize: size * 0.4 }}
    >
      {avatarLetter(name)}
    </span>
  );
}

export function TkFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "tk-frame grid grid-cols-1 overflow-hidden rounded-[28px] bg-[var(--tk-bg)] text-[var(--tk-fg)] shadow-[var(--tk-frame-shadow)] lg:grid-cols-[minmax(320px,370px)_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TkSidebar({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("order-2 flex min-h-0 flex-col lg:order-1", className)}>{children}</aside>;
}

export function TkMapArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative order-1 min-h-[360px] overflow-hidden bg-[var(--tk-map)] lg:order-2 lg:rounded-s-[28px]", className)}>
      {children}
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
    <label className="flex h-11 items-center gap-2 rounded-xl border border-[var(--tk-line)] bg-[var(--tk-hover)] px-3.5 transition-colors focus-within:border-[var(--tk-line-strong)]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--tk-fg)] outline-none placeholder:text-[var(--tk-muted)]"
      />
      <Search className="size-4 shrink-0 text-[var(--tk-soft)]" />
    </label>
  );
}

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
      <div className="mb-1.5 text-xs text-[var(--tk-soft)]">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-9 w-full cursor-pointer appearance-none truncate rounded-lg border border-[var(--tk-line)] bg-transparent ps-3 pe-7 text-[13px] text-[var(--tk-fg)] outline-none transition-colors hover:border-[var(--tk-line-strong)] focus:border-[var(--tk-line-strong)] [&>option]:bg-[var(--tk-surface)]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-[var(--tk-soft)]" />
      </div>
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
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 self-end rounded-lg border px-3 text-[13px] transition-colors",
        active
          ? "border-[var(--tk-accent)] bg-[var(--tk-accent)]/10 text-[var(--tk-accent)]"
          : "border-[var(--tk-line)] text-[var(--tk-fg)] hover:border-[var(--tk-line-strong)]",
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
    <li data-row={dataId} className="tk-row-enter" style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-[background,border-color,box-shadow,opacity] duration-200",
          selected
            ? "border-[var(--tk-accent)] bg-[var(--tk-hover)] shadow-[0_0_0_1px_var(--tk-accent-soft),0_0_22px_-6px_var(--tk-accent-soft)]"
            : "border-transparent hover:bg-[var(--tk-hover)]",
          muted && !selected && "opacity-45 hover:opacity-80",
        )}
      >
        {children}
      </div>
    </li>
  );
}

/** Small outline hexagon with a number, the trailing marker on each row. */
export function TkHex({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span className="relative grid size-[22px] shrink-0 place-items-center text-[var(--tk-soft)]" title={title}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z" strokeLinejoin="round" />
      </svg>
      <span className="relative text-[9px] leading-none font-bold tabular-nums">{children}</span>
    </span>
  );
}

/** The detail card that floats next to the selected pin. */
export function TkCard({
  name,
  sub,
  stats,
  title,
  lines,
  action,
}: {
  name: string;
  sub: ReactNode;
  stats: { icon: ReactNode; text: string; tone?: string }[];
  title: string;
  lines: ReactNode[];
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--tk-line)] bg-[var(--tk-surface)] p-4 text-[var(--tk-fg)] shadow-[var(--tk-card-shadow)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <TkAvatar name={name} size={42} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{name}</div>
          <div className="truncate text-[11.5px] text-[var(--tk-muted)]">{sub}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1 rounded-xl border border-[var(--tk-line)] px-2.5 py-2 text-[11.5px]">
        {stats.map((s, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5" style={s.tone ? { color: s.tone } : undefined}>
            <span className="shrink-0 text-[var(--tk-soft)] [&>svg]:size-3.5">{s.icon}</span>
            <span className="truncate tabular-nums">{s.text}</span>
          </span>
        ))}
      </div>
      <div className="mt-3 text-[15px] leading-snug font-semibold">{title}</div>
      {lines.length > 0 && (
        <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-[var(--tk-soft)]">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--tk-soft)]" />
              <span className="min-w-0">{line}</span>
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

export const tkCardButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--tk-line)] bg-[var(--tk-hover)] text-sm font-medium text-[var(--tk-fg)] no-underline transition-colors hover:border-[var(--tk-line-strong)] hover:bg-[var(--tk-hover-strong)] hover:no-underline";
