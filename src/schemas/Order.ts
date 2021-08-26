import { Schema, model } from "mongoose";
import { OrderInterface } from "../interfaces/OrderInterface";

const OrderSchema: Schema = new Schema({
  symbol: { type: String, required: false },
  time: { type: Date, required: false },
  price: { type: String, required: false },
  earn: { type: String, required: false },
  quantity: { type: String, required: false },
  status: { type: String, required: false },
  order: { type: String, required: false },
  martinGale: { type: Number, required: false, default: 0 },
  martinSignal: { type: Number, required: false, default: 0 },
});

OrderSchema.set('timestamps', true);
export default model<OrderInterface>("Order", OrderSchema);
