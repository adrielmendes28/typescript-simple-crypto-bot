import { Document } from "mongoose";
export interface TradeInterface extends Document {
  eventType: string;
  symbol: string;
  price: number;
  qty: number;
  total: number;
  maker: boolean;
  tradeId: string;
  time: number;
}