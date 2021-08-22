import { Schema, model } from "mongoose";
import { SymbolInterface } from "../interfaces/SymbolInterface";

const SymbolSchema: Schema = new Schema(
  {
    id: { type: String, required: false },
    symbol: { type: String, required: false }
  }
); 

SymbolSchema.set('timestamps', true);
export default model<SymbolInterface>("Symbol", SymbolSchema);
