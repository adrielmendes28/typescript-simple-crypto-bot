import { Document } from "mongoose";

export interface OrderInterface extends Document {
  symbol:string,
  cliente:string,
  ROI:number,
  maxROIReached:number,
  quantity:number,
  status: String
}
