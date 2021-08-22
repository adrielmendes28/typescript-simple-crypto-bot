import { Document } from "mongoose";

export interface OrderBookInterface extends Document {
  id: string;
  symbol: string;
  bids: [{ value: number, qty: number, order: string }];
  asks: [{ value: number, qty: number, order: string }];
  time: number;
}
