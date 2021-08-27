import Binance from 'node-binance-api';
import Trade from "../schemas/Trade";
import Symbol from '../schemas/Symbol';
import { PriceService } from '../services/PriceService';
import { OrderService } from '../services/OrderService';
import { OrderBookService } from '../services/OrderBookService';
import { CandleStickService } from '../services/CandleStickService';
import Price from '../schemas/Price';

export class TradeService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });
  private candleStickService = new CandleStickService;
  private priceService = new PriceService;
  private orderBook = new OrderBookService;
  private startAmount = 50;
  private log = require("log-beautify");
  private orderService = new OrderService;

  public async nowRSI(symbol: string): Promise<any> {
    let stochRSI = await this.candleStickService.calculateStochasticRSI(symbol);
    let stochRSIVal = stochRSI[stochRSI.length - 1];

    stochRSIVal = {
      overBought: stochRSIVal.stochRSI >= 80,
      overSold: stochRSIVal.stochRSI <= 40,
      rsiVal: stochRSIVal.stochRSI,
    };
    return {
      haveSignal: stochRSIVal.overSold || stochRSIVal.overBought,
      stoch: {
        signal: { buy: stochRSIVal.overSold, sell: stochRSIVal.overBought }, value: stochRSIVal.rsiVal
      }
    }
  }


  public async tradeSymbols() {
    const symbols = await Symbol.find({});
    let totalLoss = 0;
    let totalWin = 0;
    await Promise.all(symbols.map(async (symbol) => {
      try {
        var currency = symbol.symbol;
        var lastPrice = await this.priceService.getLastPrice(currency);
        var lastBook = await this.orderBook.getLastBook(currency);
        var lastCandle = await this.candleStickService.getLastCandle(currency);
        var rsiCheck = await this.nowRSI(currency);
        var { floatingEarn, floatingLoss, openOrders } = await this.orderService.verifyOpenOrders(currency, lastPrice?.price, lastCandle);

        totalWin += floatingEarn;
        totalLoss += floatingLoss;
        this.log.info(`${currency} - PRICE: ${lastPrice?.price} - LOW: ${lastCandle?.low} - HIGH: ${lastCandle?.high} `);
        if (rsiCheck.haveSignal) {
          let order = rsiCheck.stoch.signal.buy ? 'buy' : 'sell';
          let buyForce = lastBook?.interest?.buy >= 65;
          let sellForce = lastBook?.interest?.sell >= 65;
          if (order == 'buy' && !sellForce && (lastBook?.bids.length >= 20 && lastBook?.asks.length >= 20)) {
            if (lastBook?.wallsByBids.length > 0 && lastPrice?.price > lastCandle.low * 1.2) {
              let betterBid = lastBook?.bids[0];
              lastCandle.low = (lastBook?.wallsByBids[0] <= betterBid) ? betterBid : lastBook?.wallsByBids[0];
            }
            this.log.success(`${currency} SIGNAL ${order.toUpperCase()} ON ${parseFloat(lastCandle.low)}USDT`);


            if (openOrders.length === 0) {
              if (lastPrice?.price <= lastCandle.low) {
                await this.orderService.createNewOrder(currency, lastPrice?.price, (this.startAmount / lastPrice?.price), 'BUY');
              }
            }
          }
          if (order == 'sell' && !buyForce && (lastBook?.bids.length > 20 && lastBook?.asks.length > 20)) {
            this.log.error(`${currency} SIGNAL ${order.toUpperCase()} AT ` + lastCandle?.high);
          }
        };
      } catch (err) {
        console.log(err);
      }
    }));

    let balance = totalWin + totalLoss;
    if (balance > 0) this.log.success(`TOTAL ON OPERATIONS: ${balance}`)

    if (balance < 0) this.log.warn(`TOTAL ON OPERATIONS: ${balance.toFixed(3)}USDT`)
  }

  public async startSocketTrade(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);

    this.binance.websockets.trades(symbols, async (trades: any) => {
      let { e, E, s, p, q, m, a } = trades;
      await Trade.create({
        eventType: e,
        time: E,
        symbol: s,
        price: p,
        qty: q,
        total: parseFloat(p) * parseFloat(q),
        maker: m,
        tradeId: a
      });

      await Price.findOneAndUpdate({ symbol: s},{symbol: s, price: parseFloat(p), time: E}, 
        { upsert: true })
    });
  }
}
