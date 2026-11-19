/**
 * Page numbers to show, with "gap" for elided ranges. Always includes the
 * first and last page and `radius` pages around the current one:
 * pageList(6, 20) → [1, "gap", 5, 6, 7, "gap", 20]
 */
export function pageList(current: number, total: number, radius = 1): (number | "gap")[] {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total]);
  for (let p = current - radius; p <= current + radius; p++) if (p >= 1 && p <= total) pages.add(p);
  // Avoid a gap that would hide a single page: 1 … 3 → 1 2 3.
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("gap");
    out.push(p);
  });
  return out;
}
