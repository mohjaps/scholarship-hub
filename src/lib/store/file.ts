import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Opportunity, OpportunityQuery } from "../types";
import { applyQuery } from "./filter";
import type { ScrapeRun, Store } from "./types";

interface FileData {
  items: Record<string, Opportunity & { firstSeenAt?: string }>;
  runs: ScrapeRun[];
}

/** JSON-file store for local development (no database needed). Not for Vercel. */
export class FileStore implements Store {
  constructor(private file = path.join(process.cwd(), ".data", "opportunities.json")) {}

  private async load(): Promise<FileData> {
    try {
      return JSON.parse(await readFile(this.file, "utf8")) as FileData;
    } catch {
      return { items: {}, runs: [] };
    }
  }

  private async save(data: FileData) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, this.file);
  }

  async upsert(items: Opportunity[]) {
    const data = await this.load();
    for (const item of items) {
      data.items[item.id] = { ...item, firstSeenAt: data.items[item.id]?.firstSeenAt ?? item.scrapedAt };
    }
    await this.save(data);
  }

  async query(query: OpportunityQuery) {
    const data = await this.load();
    return applyQuery(Object.values(data.items), query);
  }

  async get(id: string) {
    return (await this.load()).items[id] ?? null;
  }

  async recordRun(run: ScrapeRun) {
    const data = await this.load();
    data.runs = [run, ...data.runs].slice(0, 50);
    await this.save(data);
  }

  async lastRun() {
    return (await this.load()).runs[0] ?? null;
  }
}
