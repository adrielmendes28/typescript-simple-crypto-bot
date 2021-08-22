import { Schema, model } from "mongoose";
import { TradeInterface } from "../interfaces/TradeInterface";

const TradeSchema: Schema = new Schema({
  eventType: { type: String, required: false },
  symbol: { type: String, required: false },
  price: { type: Number, required: false },
  quantity: { type: Number, required: false },
  maker: { type: Boolean, required: false },
  tradeId: { type: Number, required: false },
  time: { type: Date, required: false },
});

TradeSchema.set('timestamps', true);
export default model<TradeInterface>("Trade", TradeSchema);
