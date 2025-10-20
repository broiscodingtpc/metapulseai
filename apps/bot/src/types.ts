export type TokenTradeMsg = {
  type: "tokenTrade";
  mint: string;
  buyer?: string;
  seller?: string;
  price?: number;
  signature?: string;
  slot?: number;
};

export type NewTokenMsg = {
  type: "newToken";
  mint: string;
  name?: string;
  symbol?: string;
  description?: string;
};
