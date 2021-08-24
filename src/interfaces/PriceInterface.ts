import { Document } from "mongoose";
export interface PriceInterface extends Document {
  symbol: string;
  price: number,
  time: number
}