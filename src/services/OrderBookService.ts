import OrderBook from "../schemas/OrderBook";
import Binance from 'node-binance-api';
import { SymbolService } from './SymbolService';
import { SymbolInterface } from '../interfaces/SymbolInterface';

export class OrderBookService {

  private binance = new Binance().options({
    APIKEY: '3IxaGjA768Hf9zcAcNI1pAcaP5kSjIubrIAe3CqLhiJeQ7Hw7rFoXXGXk3HFCdSd',
    APISECRET: process.env.API_SECRET
  });

  public async getSymbolOrderBook(symbol: string): Promise<any> {
    let ticker = await this.binance.depth(symbol);
    return ticker
  }

  private normalizeBook(bidAsk: any, order: string) {
    let book: any[] = [];
    Object.keys(bidAsk).forEach(bidKey => {
      let bidValue = bidAsk[bidKey];
      let bookItem = {
        value: Number(bidKey),
        qty: Number(bidValue),
        order: order
      }
      book.push(bookItem);
    });
    return book;
  }

  public async updateOrderBook(time: number) {
    const symbols: SymbolInterface[] = await new SymbolService().getSymbols();
    await Promise.all(symbols.map(async (symbol) => {
      const nowDepth = await this.getSymbolOrderBook(symbol.symbol);
      let { bids, asks } = nowDepth;
      bids = await this.normalizeBook(bids, 'BUY');
      asks = await this.normalizeBook(asks, 'SELL');

      let lastMarketDepth = {
        symbol: symbol.symbol,
        asks,
        bids,
        time
      }
      await OrderBook.create(lastMarketDepth);
    }));
  }

}
