import { Schema, model } from "mongoose";
import { OrderBookInterface } from "../interfaces/OrderBookInterface";

const orderItemSchema: Schema = new Schema({
  position: { type: Number, required: false },
  price: { type: Number, required: false },
  qty: { type: Number, required: false },
  total: { type: Number, required: false },
  order: { type: String, required: false }
});

const wallItemSchema: Schema = new Schema({
  price: { type: Number, required: false },
  amount: { type: Number, required: false },
  total: { type: Number, required: false }
});

const OrderBookSchema: Schema = new Schema({
  id: { type: String, required: false },
  symbol: { type: String, required: false },
  bids: [orderItemSchema],
  asks: [orderItemSchema],
  spread: { type: Number, required: false },
  depthByPercent: {
    up: { type: Number, required: false }, down: { type: Number, required: false },
  },
  median: {
    buy: { type: Number, required: false }, sell: { type: Number, required: false },
  },
  interest: {
    buy: { type: Number, required: false }, sell: { type: Number, required: false },
    amountBuy: { type: Number, required: false },
    amountSell: { type: Number, required: false }
  },
  wallsByAsks: [wallItemSchema],
  wallsByBids: [wallItemSchema],
  time: { type: Date, required: false }
});

OrderBookSchema.set('timestamps', true);
export default model<OrderBookInterface>("OrderBook", OrderBookSchema);
