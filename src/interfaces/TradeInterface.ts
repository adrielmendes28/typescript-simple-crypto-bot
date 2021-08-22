import { Document } from "mongoose";

export interface TradeInterface extends Document {
  eventType: string;
  symbol: string;
  price: number;
  quantity: number;
  maker: boolean;
  tradeId: string;
  time: number;
}