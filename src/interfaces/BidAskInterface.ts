import { Document } from "mongoose";
export interface BidAskInterface extends Document {
  id: string;
  symbol: string;
  bidPrice: number,
  bidQty: number,
  askPrice: number,
  askQty: number,
  time: number
}
