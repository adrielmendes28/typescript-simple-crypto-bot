import { Schema, model } from "mongoose";
import { CandleInterface } from "../interfaces/CandleInterface";

const CandleStickSchema: Schema = new Schema({
  symbol:  { type: String, required: false },
  time: { type: Date, required: false },
  open: { type: Number, required: false },
  high: { type: Number, required: false },
  low: { type: Number, required: false },
  close: { type: Number, required: false },
  volume: { type: Number, required: false },
  isFinal: { type: Boolean, required: false },
});


const CandleManagemenSchema: Schema = new Schema({
  symbol:  { type: String, required: false },
  candles: [CandleStickSchema]
});

CandleManagemenSchema.set('timestamps', true);
export default model<any>("CandleManagement", CandleManagemenSchema);
