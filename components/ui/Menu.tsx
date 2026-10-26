"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

export type MenuItem =
  | { kind: "link"; label: string; href: string; icon?: ReactNode }
  | { kind: "action"; label: string; onSelect: () => void; icon?: ReactNode; danger?: boolean }
  | { kind: "label"; label: ReactNode };

/** Menu button (WAI-ARIA pattern): Enter/Space/ArrowDown opens, arrows move, Escape closes. */
export default function Menu({
  label,
  trigger,
  items,
  triggerClassName,
  align = "end",
}: {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  triggerClassName: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const focusable = items.map((item, index) => (item.kind === "label" ? -1 : index)).filter((index) => index >= 0);

  const focusItem = (position: number) => {
    const count = focusable.length;
    if (!count) return;
    itemRefs.current[focusable[((position % count) + count) % count]]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => focusItem(0), 0);
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointer);
    };
    // focusItem only depends on refs and the item list captured at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const current = focusable.findIndex((index) => itemRefs.current[index] === document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(focusable.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const itemClass = (danger = false) =>
    `flex min-h-11 w-full items-center gap-2.5 rounded-control px-3 text-left text-body ${
      danger ? "text-danger" : "text-ink"
    } hover:bg-surface focus-visible:bg-surface`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`animate-pop-in absolute top-full z-40 mt-1.5 min-w-60 rounded-control border border-line bg-bg p-1.5 shadow-pop ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => {
            if (item.kind === "label") {
              return (
                <div key={index} role="presentation" className="border-b border-line px-3 pb-2.5 pt-1.5 mb-1.5">
                  {item.label}
                </div>
              );
            }
            if (item.kind === "link") {
              return (
                <Link
                  key={index}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  role="menuitem"
                  href={item.href}
                  tabIndex={-1}
                  onClick={() => close(false)}
                  className={itemClass()}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={index}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  close(false);
                  item.onSelect();
                }}
                className={itemClass(item.danger)}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
