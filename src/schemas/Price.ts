import { Schema, model } from "mongoose";
import { PriceInterface } from "../interfaces/PriceInterface";

const PriceSchema: Schema = new Schema({
  symbol: { type: String, required: false },
  price: { type: Number, required: false },
  time: { type: Date, required: false }
});

PriceSchema.set('timestamps', true);
export default model<PriceInterface>("Price", PriceSchema);
