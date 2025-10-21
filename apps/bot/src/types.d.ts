declare module '@metapulse/core' {
  export function techScore(input: any): number;
  export function totalScore(input: any): number;
  export function llmMeta(input: any, key?: string, model?: string): Promise<any>;
  export function heuristicMeta(name?: string, symbol?: string, desc?: string): any;
}

declare module '@metapulse/pumpportal' {
  export class PumpPortalWS {
    constructor(apiKey: string | undefined, onMsg: (m: any) => void);
    connect(): void;
    subscribe(options: { method: string }): void;
  }
}
