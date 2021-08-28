import Symbol from '../schemas/Symbol';
import { SymbolInterface } from '../interfaces/SymbolInterface';
export class SymbolService {
  public async getSymbols() {
    let symbols:any = await Symbol.find({});
    if (symbols.length == 0) await Symbol.insertMany([{ symbol: 'ADAUSDT' },{symbol: 'BTTUSDT'},{symbol:'DOGEUSDT'}]);
    symbols  = await Symbol.find({});
    return symbols;
  }
}
