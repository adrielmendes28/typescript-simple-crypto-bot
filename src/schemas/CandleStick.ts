import { Schema, model } from "mongoose";
import { CandleInterface } from "../interfaces/CandleInterface";

const CandleStickSchema: Schema = new Schema({
  symbol: { type: { type: String, required: false } },
  time: { type: Date, required: false },
  openTime: { type: Date, required: false },
  closeTime: { type: Date, required: false },
  open: { type: Number, required: false },
  high: { type: Number, required: false },
  low: { type: Number, required: false },
  close: { type: Number, required: false },
  volume: { type: Number, required: false },
  trades: { type: Number, required: false },
  interval: { type: String, required: false },
  isFinal: { type: Boolean, required: false },
  quoteVolume: { type: Number, required: false },
  buyVolume: { type: Number, required: false },
  quoteBuyVolume: { type: Number, required: false }
});

CandleStickSchema.set('timestamps', true);
export default model<CandleInterface>("CandleStick", CandleStickSchema);
