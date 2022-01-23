import { Schema, model } from "mongoose";
import { OrderInterface } from "../interfaces/OrderInterface";

const OrderSchema: Schema = new Schema({
  symbol: { type: String, required: false },
  cliente: { type: String, required: false },
  ROI: { type: Number, required: false },
  maxROIReached: { type: Number, required: false },
  quantity: { type: Number, required: false },
  status: { type: String, required: false }
});

OrderSchema.set('timestamps', true);
export default model<OrderInterface>("Order", OrderSchema);
