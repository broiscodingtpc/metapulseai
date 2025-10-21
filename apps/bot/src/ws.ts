import { PumpPortalWS } from "@metapulse/pumpportal";
import type { NewTokenMsg, TokenTradeMsg } from "./types.js";

export function connectPumpPortal(apiKey: string | undefined, onMsg: (m: any) => void) {
  const ws = new PumpPortalWS(apiKey, onMsg);
  ws.connect();
  ws.subscribe({ method: "subscribeNewToken" });
  return ws;
}
