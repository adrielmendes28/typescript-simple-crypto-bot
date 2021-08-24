import { Document } from "mongoose";
export interface CandleInterface extends Document {
  symbol: string;
  time: Date;
  openTime: Date;
  closeTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  interval: string;
  isFinal: boolean;
  quoteVolume: number;
  buyVolume: number;
  quoteBuyVolume: number;
}
