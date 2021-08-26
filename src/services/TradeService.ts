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
  private startAmount = 200;
  private alerts = require('trading-indicator').alerts;
  private stochasticRSI = require('trading-indicator').stochasticRSI;
  private log = require("log-beautify");

  public async nowRSI(symbol: string): Promise<any> {
    let stochRSI = await this.stochasticRSI(3, 3, 14, 14, "close", "binance", symbol, "5m", true);
    let stochRSIVal = stochRSI[stochRSI.length - 1];

    stochRSIVal = {
      overBought: stochRSIVal.stochRSI >= 80,
      overSold: stochRSIVal.stochRSI <= 40,
      rsiVal: stochRSIVal.stochRSI,
    };
    // let SMA = await this.alerts.priceCrossSMA(14, 'binance', symbol, "5m", false) 
    // let EMA = await this.alerts.priceCrossEMA(14, 'binance', symbol, "5m", false) 
    return {
      haveSignal: stochRSIVal.overSold || stochRSIVal.overBought,
      stoch: {
        signal: { buy: stochRSIVal.overSold, sell: stochRSIVal.overBought }, value: stochRSIVal.rsiVal
      }
    }
  }

  public async closeOrder(orderItem: any, earn: any, price: any) {
    await this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE');
    await OrderSchema.findOneAndUpdate({
      _id: orderItem._id,
      symbol: orderItem.symbol,
      status: 'OPEN'
    }, {
      $set: {
        status: 'FINISH',
        earn: earn.toString()
      }
    });
  }




  public async trailingStopLoss(orderItem: any, earnF: any, price: any, lastCandle: any) {
    let next = true;
    let takeProfit = (orderItem.price * orderItem.quantity) * 1.015;
    let takeLoss = (orderItem.price * orderItem.quantity) - ((orderItem.price * orderItem.quantity) * 0.02);
    let atualPrice = (price * orderItem.quantity);
    let balance = (atualPrice - (orderItem.price * orderItem.quantity)) > 0;
    console.log(`TP/TL: ${takeProfit.toFixed(2)}/${takeLoss.toFixed(2)}`, `NOW: ${atualPrice.toFixed(2)}`)
    if (atualPrice >= takeProfit) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price);
    }
    if (atualPrice <= takeLoss) {
      await this.closeOrder(orderItem, earnF.toString(), price);;
    }
    if (price >= lastCandle.high && balance) {
      await this.closeOrder(orderItem, earnF.toString(), price);;
    }
    return {
      next
    }
  }

  public async verifyOpenOrders(symbol: string, price: number, lastCandle: any) {
    var openOrders = await OrderSchema.find({ status: 'OPEN', symbol });
    var floatingEarn = 0;
    var floatingLoss = 0;
    await Promise.all(openOrders.map(async (orderItem: any) => {
      let earnF = (price - parseFloat(orderItem.price)) * parseFloat(orderItem.quantity);
      let trailingStop = await this.trailingStopLoss(orderItem, earnF, price, lastCandle);
      var localLoss = 0;
      var localEarn = 0;
      if (trailingStop.next) {
        let priceBuy = orderItem.price * orderItem.quantity;
        if (earnF > 0) {
          floatingEarn += earnF;
          localEarn = earnF;
        }
        if (earnF < 0) {
          localLoss = earnF;
          floatingLoss += earnF;
          let checkAgain = await OrderSchema.find({ status: 'OPEN', symbol });
          if (price <= orderItem.price && orderItem.martinGale < 3 && checkAgain.length < 2) {
            let maxMartinLoss = orderItem.martinGale == 0 ? 0.005 * orderItem.price : (orderItem.martinGale == 1 ? 0.010 * orderItem.price : (orderItem.martinGale == 2 ? 0.035 * orderItem.price : 0.04 * orderItem.price))
            let maxLoss = (orderItem.price - maxMartinLoss);
            let warningLoss = (orderItem.price - 0.003 * orderItem.price);
            if (price <= warningLoss) this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
            if (price <= maxLoss) {
              let martinSignal = orderItem.martinSignal + 1;
              if (martinSignal >= 10) {
                await OrderSchema.findOneAndUpdate({
                  _id: orderItem._id,
                }, {
                  $set: {
                    martinGale: orderItem.martinGale + 1,
                    martinSignal: 0
                  }
                });
                this.log.error(`MAX LOSS REACHEAD ${maxMartinLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                await this.createNewOrder(symbol, price, orderItem.quantity * 2, 'BUY', 'OPEN', 99);
              } else {
                await OrderSchema.findOneAndUpdate({
                  _id: orderItem._id,
                }, {
                  $set: {
                    martinSignal
                  }
                });
              }
            }
          };
        };
        let objetivo = (orderItem.price * orderItem.quantity) * 1.01;
        if (localEarn > 0) {
          this.log.success(`[${symbol}]`, 'START:', priceBuy.toFixed(3), 'POSITION RESULT', (earnF + priceBuy).toFixed(3), 'GOAL', objetivo.toFixed(3), `WIN: ${localEarn.toFixed(3)}USDT - LOSS: ${localLoss.toFixed(3)}USDT`);
        } else {
          this.log.error(`[${symbol}]`, 'START:', priceBuy.toFixed(3), 'POSITION RESULT', (earnF + priceBuy).toFixed(3), 'GOAL', objetivo.toFixed(3), `WIN: ${localEarn.toFixed(3)}USDT - LOSS: ${localLoss.toFixed(3)}USDT`);
        }

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
      price: price.toString(),
      quantity: quantity.toString(),
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
        var { floatingEarn, floatingLoss, openOrders } = await this.verifyOpenOrders(currency, lastPrice?.price, lastCandle);

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
                await this.createNewOrder(currency, lastPrice?.price, (this.startAmount / lastPrice?.price), 'BUY');
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
      })
      await Price.create({
        symbol: s,
        price: parseFloat(p),
        time: E
      });
    });
  }
}
