import Binance from 'node-binance-api';
import Trade from "../schemas/Trade";
import Symbol from '../schemas/Symbol';
import Price from '../schemas/Price';
import OrderSchema from '../schemas/Order';
import { PriceService } from '../services/PriceService';
import { OrderBookService } from '../services/OrderBookService';
import { CandleStickService } from '../services/CandleStickService';
export class TradeService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  private alerts = require('trading-indicator').alerts;
  private stochasticRSI = require('trading-indicator').stochasticRSI;

  public async nowRSI(symbol: string): Promise<any> {
    let stochRSI = await this.stochasticRSI(3, 3, 14, 14, "close", "binance", symbol, "5m", true);
    let stochRSIVal = stochRSI[stochRSI.length - 1];
    stochRSIVal = {
      overBought: stochRSIVal.stochRSI >= 80,
      overSold: stochRSIVal.stochRSI <= 25,
      rsiVal: stochRSIVal.stochRSI,
    };
    // let SMA = await this.alerts.priceCrossSMA(14, 'binance', symbol, '5m', false) 
    // let EMA = await this.alerts.priceCrossEMA(14, 'binance', symbol, '5m', false) 
    return {
      haveSignal: stochRSIVal.overSold || stochRSIVal.overBought,
      stoch: {
        signal: { buy: stochRSIVal.overSold, sell: stochRSIVal.overBought }, value: stochRSIVal.rsiVal
      }
    }
  }

  public async closeOrder(orderItem: any, earn: number) {
    await OrderSchema.findOneAndUpdate({
      _id: orderItem._id,
      symbol: orderItem.symbol,
      status: 'OPEN'
    }, {
      $set: {
        status: 'FINISH',
        earn: earn
      }
    });
  }
  public async verifyOpenOrders(symbol: string, price: number) {
    var openOrders = await OrderSchema.find({ status: 'OPEN', symbol });
    var floatingEarn = 0;
    var floatingLoss = 0;
    var TP = 0.01;
    await Promise.all(openOrders.map(async (orderItem: any) => {
      if (orderItem.price <= price) {
        let earn = (price - orderItem.price) * orderItem.quantity
        floatingEarn += earn;
        // console.log('price', price, 'metaVenda', (orderItem.price + (orderItem.price * TP)));
        if (price >= (orderItem.price + (orderItem.price * TP))) {
          await this.createNewOrder(symbol, price, orderItem.quantity, 'SELL', 'CLOSE');
          await this.closeOrder(orderItem, earn);
        }
      }
      if (orderItem.price >= price) {
        let loss = (orderItem.price - price) * orderItem.quantity;
        floatingLoss += loss;
        console.log(loss);
      }
    }));

    return {
      openOrders,
      floatingLoss,
      floatingEarn
    };

  }

  public async createNewOrder(currency: string, price: number, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0) {
    await OrderSchema.create({
      symbol: currency,
      time: new Date().getTime(),
      price: price,
      quantity: quantity,
      status,
      order: order,
      martinGale: martingale
    });
  }

  public async tradeSymbols() {
    const priceService = new PriceService;
    const orderBook = new OrderBookService;
    const candleStickService = new CandleStickService;
    const symbols = await Symbol.find({});
    let totalLoss = 0;
    let totalWin = 0;
    await Promise.all(symbols.map(async (symbol) => {
      try {
        var currency = symbol.symbol;
        var lastPrice = await priceService.getLastPrice(currency);
        var lastBook = await orderBook.getLastBook(currency);
        var lastCandle = await candleStickService.getLastCandle(currency);
        var rsiCheck = await this.nowRSI(currency);
        var { floatingEarn, floatingLoss, openOrders } = await this.verifyOpenOrders(currency, lastPrice?.price);
        var startAmount = 20;
        totalWin += floatingEarn;
        totalLoss += floatingLoss;;
        console.log(`${currency} - ${lastPrice?.price} - ${lastCandle?.low} Win ${floatingEarn} Loss ${floatingLoss} `);

        if (rsiCheck.haveSignal) {
          let order = rsiCheck.stoch.signal.buy ? 'buy' : 'sell';
          let buyForce = lastBook?.interest?.buy >= 60;
          let sellForce = lastBook?.interest?.sell >= 60;
          if (order == 'buy' && sellForce) {
            console.log(`${currency} SIGNAL ${order.toUpperCase()} ON` + lastCandle.low);
            if (openOrders.length > 0) {
              await Promise.all(openOrders.map(async (openOrder: any) => {
                let loss = lastPrice?.price - openOrder.price;
                let maxLoss = (loss / lastPrice?.price) * 100;
                if (lastPrice?.price <= openOrder.price && openOrder.martinGale <= 2) {
                  let maxMartinLoss = openOrder.martinGale == 0 ? 4 : (openOrder.martinGale == 1 ? 5 : (openOrder.martinGale == 2 ? 7 : 10))
                  if (maxLoss >= 4) {
                    console.log('Perda máxima de 4% martingale ativado');
                    await OrderSchema.findOneAndUpdate({
                      _id: openOrder._id,
                      symbol: currency,
                      status: 'OPEN'
                    }, {
                      $set: {
                        martinGale: openOrder.martinGale+1
                      }
                    });
                    await this.createNewOrder(currency, lastPrice?.price, openOrder.quantity * 2, 'BUY', 'OPEN', 3);
                  }
                };
              }));
            }
            if (openOrders.length === 0) {
              if (lastPrice?.price <= lastCandle.low) {
                await this.createNewOrder(currency, lastCandle.low, (startAmount / lastPrice?.price), 'BUY');
              }
            }
          }
          if (order == 'sell' && buyForce) {
            console.log(`${currency} SIGNAL ${order.toUpperCase()} AT` + lastCandle?.high);
            if (openOrders.length > 0) {
              await Promise.all(openOrders.map(async (openOrder: any) => {
                if (openOrder.price < lastPrice?.price && lastPrice?.price >= lastCandle?.high - ((lastCandle?.high / 100) * 2)) {
                  let earn = (lastPrice?.price * openOrder.quantity) - (openOrder.price * openOrder.quantity);
                  await this.closeOrder(openOrder, earn);
                }
              }));
            }
          }
        };
      } catch (err) {
        console.log(err);
      }
    }));

    console.log({ totalWin, totalLoss })
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
        total: Number(p) * Number(q),
        maker: m,
        tradeId: a
      })
      await Price.create({
        symbol: s,
        price: Number(p),
        time: E
      });
    });
  }
}
