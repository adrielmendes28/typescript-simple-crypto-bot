import { Schema, model } from "mongoose";
import { OrderInterface } from "../interfaces/OrderInterface";

const OrderSchema: Schema = new Schema({
  symbol: { type: String, required: false },
  orderId: { type: String, required: false },
  time: { type: Date, required: false },
  price: { type: String, required: false },
  earn: { type: String, required: false },
  quantity: { type: String, required: false },
  status: { type: String, required: false },
  order: { type: String, required: false },
  martinGale: { type: Number, required: false, default: 0 },
  martinSignal: { type: Number, required: false, default: 0 },
  sendStop: { type: String, required: false, default: false },
  sendProfit: { type: String, required: false, default: false },
  stopLoss: {type: String, required: false, default: false},
  takeProfit: {type: String, required: false, default: false},
  originalPrice: {type: String, required: false, default: false},
});

OrderSchema.set('timestamps', true);
export default model<OrderInterface>("Order", OrderSchema);
