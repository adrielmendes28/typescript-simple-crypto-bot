import { Document } from "mongoose";

export interface OrderInterface extends Document {
  id: string;
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  time: number;
  price: number;
  origQty: number;
  executedQty: number;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
}
