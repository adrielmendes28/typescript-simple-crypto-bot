import { Schema, model } from "mongoose";
import { OrderInterface } from "../interfaces/OrderInterface";

const OrderSchema: Schema = new Schema({
  id: { type: String, required: false },
  symbol: { type: String, required: false },
  orderId: { type: String, required: false },
  clientOrderId: { type: String, required: false },
  transacttime: { type: Date, required: false },
  time: { type: Date, required: false },
  price: { type: Number, required: false },
  origQty: { type: Number, required: false },
  executedQty: { type: Number, required: false },
  status: { type: String, required: false },
  timeInForce: { type: String, required: false },
  type: { type: String, required: false },
  side: { type: String, required: false },
});

OrderSchema.set('timestamps', true);
export default model<OrderInterface>("Order", OrderSchema);
