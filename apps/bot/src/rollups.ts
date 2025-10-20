type Roll = { t: number; buyer?: string; seller?: string; price?: number };
type Store = Map<string, Roll[]>;

export class Rollups {
  private store: Store = new Map();

  add(mint: string, data: Roll) {
    const arr = this.store.get(mint) ?? [];
    arr.push(data);
    this.store.set(mint, arr);
  }

  summary(mint: string, windowSec: number) {
    const now = Date.now() / 1000;
    const arr = (this.store.get(mint) ?? []).filter(r => (now - r.t) <= windowSec);
    const buyers = arr.filter(a => a.buyer).length;
    const sellers = arr.filter(a => a.seller).length;
    const uniqBuyers = new Set(arr.filter(a => a.buyer).map(a => a.buyer)).size;
    // naive impact estimator: price stdev proxy
    const prices = arr.map(a => a.price).filter((x): x is number => typeof x === "number");
    let impact: number | undefined = undefined;
    if (prices.length >= 3) {
      const min = Math.min(...prices), max = Math.max(...prices);
      if (min > 0) impact = ((max - min) / min) * 100;
    }
    return { buyers, sellers, uniqBuyers, impact01: impact, size: arr.length };
  }

  allMints() { return Array.from(this.store.keys()); }
}
