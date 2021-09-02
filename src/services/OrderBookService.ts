import Binance from 'node-binance-api';
import OrderBook from "../schemas/OrderBook";
import { OBA } from 'orderbook-analysis';
import { SymbolService } from './SymbolService';
import { SymbolInterface } from '../interfaces/SymbolInterface';

export class OrderBookService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });


  private bookJsonToArray(book: any){
    return Object.keys(book).map(key =>{
      return [key, book[key]];
    })
  }

  public async startOrderBookSocket(): Promise<any> {
    let symbols: any = await new SymbolService().getSymbols();
    symbols = symbols.map((s: any) => s.symbol);
    
    console.log(symbols);
    await this.binance.websockets.depthCache(symbols, async (symbol: string, depth: { bids: any; asks: any; eventTime:any; lastUpdateId: any; }) => {
      let bids = this.binance.sortBids(depth.bids);
      let asks = this.binance.sortAsks(depth.asks);
      let asksArray = this.bookJsonToArray(asks);      
      let bidsArray = this.bookJsonToArray(bids);

      let orderBookRaw = {
        time: depth.eventTime,
        lastUpdateId: depth.lastUpdateId,
        asks: asksArray,
        bids: bidsArray
      };
      
      await this.updateOrderBook(depth.eventTime, orderBookRaw, symbol);
    });

  }

  private normalizePureBook(bidAsk: any, order: string, maxLength: number) {
    let book: any[] = [];
    let amountAll = 0;
    let totalAll = 0;

    bidAsk.forEach((valueArray: any, index: number) => {
      let price = parseFloat(valueArray[0]);
      let qty = parseFloat(valueArray[1]);
      let total = price * qty;
      let bookItem = {
        position: index,
        price,
        qty,
        total,
        order: order
      }

      totalAll += total ?? 0;
      amountAll += qty ?? 0;

      book.push(bookItem);
    });
    return {
      totalAll,
      amountAll,
      book
    };
  }

  public async getSymbolOrderBook(symbol: string): Promise<any> {
    let ticker = await this.binance.depth(symbol);
    return ticker
  }

  public async updateOrderBook(time: number, orderBookRaw: any, symbol: string) {
    try {
      let orderBook = new OBA(orderBookRaw);
      let spread = orderBook.calc('spread');
      let { bids, asks } = orderBookRaw;
      let maxLength = bids.length > asks.length ? asks.length : bids.length;
      bids = await this.normalizePureBook(bids, 'BUY', maxLength);
      asks = await this.normalizePureBook(asks, 'SELL', maxLength);

      let amountBuy = bids.amountAll;
      let amountSell = asks.amountAll;

      let totalAll = amountBuy + amountSell;
      let buyPercentage = (amountBuy / totalAll) * 100;
      let sellPercentage = (amountSell / totalAll) * 100;
      let sellMedianPrice = orderBook.calc('medianByAsksPrice');
      let buyMedianPrice = orderBook.calc('medianByBidsPrice');
      let depthByPercent: any = orderBook.calc('depthByPercent');

      let lastMarketDepth = {
        symbol: symbol,
        depthByPercent: {
          up: depthByPercent.up / (depthByPercent.up + depthByPercent.down) * 100,
          down: depthByPercent.down / (depthByPercent.up + depthByPercent.down) * 100
        },
        asks: asks.book.slice(0,3),
        bids: bids.book.slice(0,3),
        spread,
        median: {
          buy: buyMedianPrice, sell: sellMedianPrice
        },
        interest: {
          buy: buyPercentage, sell: sellPercentage,
          amountBuy,
          amountSell
        },
        wallsByAsks: orderBook.calc('wallsByAsks'),
        wallsByBids: orderBook.calc('wallsByBids'),
        time
      };
      await OrderBook.create(lastMarketDepth);

    } catch (err) {
      console.log('Nesse exato segundo, o BOOK não tinha ofertas de ask/bid para essa moeda '+symbol)
    }
  }

  public async getLastBook(symbol: string): Promise<any> {
    let last = await OrderBook.findOne({ symbol: symbol }).sort({ time: -1 });
    return last;
  }

}
