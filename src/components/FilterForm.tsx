"use client";

import { useRef } from "react";

/** A GET form that re-submits whenever a select/checkbox changes (works without JS too). */
export function FilterForm({ children, action }: { children: React.ReactNode; action: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={action}
      method="get"
      className="filters"
      role="search"
      onChange={(e) => {
        const target = e.target as HTMLElement;
        if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type !== "search")) {
          ref.current?.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}
