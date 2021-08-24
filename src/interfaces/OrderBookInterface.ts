import { Document } from "mongoose";
export interface OrderBookInterface extends Document {
  id: string;
  symbol: string;
  bids: [{ position:number, price: number, qty: number, total: number, order: string }];
  asks: [{ position:number, price: number, qty: number, total: number, order: string }];
  time: number;
}
