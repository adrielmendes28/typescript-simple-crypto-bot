import Binance from 'node-binance-api';
import OrderSchema from '../schemas/Order';

export class OrderService {
  private log = require("log-beautify");

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

  
  public async verifyOpenOrders(symbol: string, price: number, lastCandle: any) {
    var openOrders = await OrderSchema.find({ status: 'OPEN', symbol });
    var floatingEarn = 0;
    var floatingLoss = 0;
    await Promise.all(openOrders.map(async (orderItem: any) => {
      let priceBuy = orderItem.price * orderItem.quantity;
      let priceNow = price * orderItem.quantity;
      let earnF = priceNow - priceBuy;
      let objetivo = (orderItem.price * orderItem.quantity) * 1.010;
      let trailingStop = await this.trailingStopLoss(orderItem, earnF, price, lastCandle);
      var localLoss = 0;
      var localEarn = 0;
      if (trailingStop.next) {
        if (earnF > 0) {
          floatingEarn += earnF;
          localEarn = earnF;
        }
        if (earnF < 0) {
          localLoss = earnF;
          floatingLoss += earnF;
          if (price <= orderItem.price && orderItem.martinGale < 3) {
            let maxMartinLoss = orderItem.martinGale == 0 ? 0.005  : (orderItem.martinGale == 1 ? 0.010 : (orderItem.martinGale == 2 ? 0.035: 0.04 ))
            let maxLoss = (orderItem.price - maxMartinLoss);
            let originalPrice = orderItem.price * orderItem.quantity;
            let takeLoss = (originalPrice) - (originalPrice * maxMartinLoss);
            let atualPrice = (price * orderItem.quantity);
            let warningLoss = (orderItem.price - 0.003 * orderItem.price);
            if (price <= warningLoss) this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
            if (atualPrice <= takeLoss) {
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
                this.log.error(`MAX LOSS REACHEAD ${takeLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
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

  public async trailingStopLoss(orderItem: any, earnF: any, price: any, lastCandle: any) {
    let next = true;
    let originalPrice = orderItem.price * orderItem.quantity;
    let binanceTax = originalPrice / 1000;
    let takeProfit = originalPrice * 1.010;
    let takeLoss = originalPrice - (originalPrice * 0.015);
    let atualPrice = (price * orderItem.quantity);
    let balance = atualPrice - originalPrice;
    
    // console.log(`TP/TL: ${takeProfit.toFixed(2)}/${takeLoss.toFixed(2)}`, `NOW: ${atualPrice.toFixed(2)}`)
    if (atualPrice >= takeProfit) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price);
    }
    if (atualPrice <= takeLoss) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price);;
    }
    if (price >= lastCandle?.high  && balance  >= binanceTax*3 && balance >= 0.1) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price);
    }
    return {
      next
    }
  }
}