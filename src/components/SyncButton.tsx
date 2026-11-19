"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncNow, type SyncResult } from "@/app/[locale]/actions";
import { dictionaries, type Locale } from "@/i18n/dictionaries";

export function SyncButton({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  const message =
    result?.status === "done"
      ? t.syncDone(result.total)
      : result?.status === "cooldown"
        ? t.syncCooldown(result.minutesLeft)
        : result?.status === "error"
          ? t.syncError
          : null;

  return (
    <span className="sync">
      <button
        type="button"
        className="sync-btn"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await syncNow();
            setResult(r);
            if (r.status === "done") router.refresh();
          })
        }
      >
        <span className={pending ? "sync-icon spinning" : "sync-icon"} aria-hidden="true">
          ↻
        </span>
        {pending ? t.syncing : t.sync}
      </button>
      <span className={`sync-msg sync-${result?.status ?? "idle"}`} role="status" aria-live="polite">
        {message}
      </span>
    </span>
  );
}
