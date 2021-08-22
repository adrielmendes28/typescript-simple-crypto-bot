import { Schema, model } from "mongoose";
import { OrderBookInterface } from "../interfaces/OrderBookInterface";

const orderItemSchema: Schema = new Schema(
  { value: { type: Number, required: false }, qty: { type: Number, required: false }, order: { type: String, required: false } }
);
const OrderBookSchema: Schema = new Schema({
  id: { type: String, required: false },
  symbol: { type: String, required: false },
  bids: [orderItemSchema],
  asks: [orderItemSchema],
  time: { type: Date, required: false }
});

OrderBookSchema.set('timestamps', true);
export default model<OrderBookInterface>("OrderBook", OrderBookSchema);
