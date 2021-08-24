import { Schema, model } from "mongoose";
import { OrderInterface } from "../interfaces/OrderInterface";

const OrderSchema: Schema = new Schema({
  symbol: { type: String, required: false },
  time: { type: Date, required: false },
  price: { type: Number, required: false },
  earn: { type: Number, required: false },
  quantity: { type: Number, required: false },
  status: { type: String, required: false },
  order: { type: String, required: false },
  martinGale: { type: Number, required: false },
});

OrderSchema.set('timestamps', true);
export default model<OrderInterface>("Order", OrderSchema);
