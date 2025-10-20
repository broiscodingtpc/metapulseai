import { llmMeta, heuristicMeta } from "@metapulse/core";

export async function labelMeta(input: { name?: string; symbol?: string; desc?: string; stats: any }, llmKey?: string, llmModel?: string) {
  try { return await llmMeta(input, llmKey, llmModel); }
  catch { return heuristicMeta(input.name, input.symbol, input.desc); }
}
