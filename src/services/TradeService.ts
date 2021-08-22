import Binance from 'node-binance-api';
import Trade from "../schemas/Trade";
import Symbol from '../schemas/Symbol';

export class TradeService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async startSocketTrade(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);

    this.binance.websockets.trades(symbols, async (trades: any) => {
      let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
      await Trade.create({ eventType, eventTime, symbol, price, quantity, maker, tradeId })
    });
  }
  
}
