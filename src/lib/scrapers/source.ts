import type { RawItem } from "./normalize";

export interface Source {
  id: string;
  name: string;
  homepage: string;
  /** Grouping shown in the UI. */
  region: "arab" | "global" | "official";
  fetch(): Promise<RawItem[]>;
}
