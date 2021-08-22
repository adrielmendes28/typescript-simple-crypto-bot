import { Document } from "mongoose";

export interface TradeInterface extends Document {
  eventType: string;
  eventTime: number;
  symbol: string;
  price: number;
  quantity: number;
  maker: boolean;
  tradeId: string
}