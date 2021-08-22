import { Document } from "mongoose";

export interface SymbolInterface extends Document {
  id: string;
  symbol: string;
}
