
import Binance from 'node-binance-api';
import Price from '../schemas/Price';
import { SymbolService } from './SymbolService';
import { SymbolInterface } from '../interfaces/SymbolInterface';
export class PriceService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async getLastPrice(symbol: string): Promise<any> {
    let last = await Price.findOne({symbol: symbol}).sort({time: -1});
    return last;
  }

  public async getSymbolPrice(symbol: string): Promise<any> {
    let ticker = await this.binance.prices(symbol);
    // console.log(`[HeartBeat] [${symbol}] [${ticker[symbol]}USDT]`);
    return ticker[symbol];
  }

  public async getAllSymbolsPrice(): Promise<any> {
    let ticker = await this.binance.prices();
    return ticker;
  }

  public async updateSymbols(time: number) {
    const symbols: SymbolInterface[]= await new SymbolService().getSymbols();
    await Promise.all(symbols.map(async (symbol) => {
      let price = await this.getSymbolPrice(symbol.symbol) ?? 0;
      let lastSymbolPrice = {
        symbol: symbol.symbol,
        price: Number(price),
        time
      }
      await Price.create(lastSymbolPrice);
    }));
  }

}
