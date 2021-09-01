import Symbol from '../schemas/Symbol';
import { SymbolInterface } from '../interfaces/SymbolInterface';
export class SymbolService {
  public async getSymbols() {
    let symbols:any = await Symbol.find({});
    if (symbols.length == 0) await Symbol.insertMany([
      { 
        "symbol" : "ADAUSDT",
        "priceDecimal" : 3.0, 
        "quantityDecimal" : 1.0
      },
      { 
          "symbol" : "BTCUSDT", 
          "priceDecimal" : 2.0, 
          "quantityDecimal" : 5.0
      },
      { 
          "symbol" : "XRPUSDT", 
          "priceDecimal" : 4.0, 
          "quantityDecimal" : 0.0
      },
      { 
          "symbol" : "RSRUSDT", 
          "priceDecimal" : 4.0, 
          "quantityDecimal" : 1.0
      },
      { 
          "symbol" : "ETHUSDT", 
          "priceDecimal" : 2.0, 
          "quantityDecimal" : 4.0
      },
      { 
          "symbol" : "DOGEUSDT", 
          "priceDecimal" : 4.0, 
          "quantityDecimal" : 0.0
      },
      { 
          "symbol" : "DODOUSDT", 
          "priceDecimal" : 3.0, 
          "quantityDecilmal" : 1.0
      },
      { 
          "symbol" : "AIONUSDT", 
          "priceDecimal" : 4.0, 
          "quantityDecilmal" : 0.0
      },
      { 
          "symbol" : "TRXUSDT", 
          "priceDecimal" : 5.0, 
          "quantityDecilmal" : 1.0
      }
    ]);
    symbols  = await Symbol.find({});
    return symbols;
  }
}
