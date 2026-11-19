"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { runScrape } from "@/lib/run";
import { getStore, storeKind } from "@/lib/store";

/** Minimum time between manual syncs, so the button can't hammer the sources. */
const COOLDOWN_MINUTES = 30;

export type SyncResult =
  | { status: "done"; total: number; failed: number }
  | { status: "cooldown"; minutesLeft: number }
  | { status: "error" };

let running: Promise<SyncResult> | null = null;

export async function syncNow(): Promise<SyncResult> {
  // One sync at a time per instance; concurrent clicks share it.
  running ??= doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync(): Promise<SyncResult> {
  try {
    const store = getStore();
    const last = await store.lastRun();
    if (last) {
      const ageMin = (Date.now() - Date.parse(last.finishedAt)) / 60_000;
      if (ageMin < COOLDOWN_MINUTES) return { status: "cooldown", minutesLeft: Math.ceil(COOLDOWN_MINUTES - ageMin) };
    }
    let run;
    if (storeKind() === "cache") {
      // No database: drop the cached scrape and read it again, which scrapes now.
      revalidateTag("scrape", { expire: 0 });
      run = await store.lastRun();
    } else {
      run = await runScrape();
    }
    revalidatePath("/[locale]", "page");
    if (!run) return { status: "error" };
    return { status: "done", total: run.total, failed: run.results.filter((r) => !r.ok).length };
  } catch (e) {
    console.error("sync failed", e);
    return { status: "error" };
  }
}
