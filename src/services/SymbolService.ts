import Symbol from '../schemas/Symbol';
import { SymbolInterface } from '../interfaces/SymbolInterface';
export class SymbolService {
  public async getSymbols() {
    const symbols: SymbolInterface[] = await Symbol.find({});
    if (symbols.length == 0) await Symbol.create({ symbol: 'ADAUSDT' });
    return symbols;
  }
}
