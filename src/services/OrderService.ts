import Binance from 'node-binance-api';
import OrderSchema from '../schemas/Order';

export class OrderService {
  private log = require("log-beautify");
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async closeOrder(orderItem: any, earn: any, price: any, symbols: any) {
    let mySymbol = symbols.find((s:any) => s.symbol === orderItem.symbol);
    let { quantity } = orderItem;
    let newQuantity = (quantity.split('.').length > 0 && mySymbol?.quantityDecimal > 0 && quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? 0))) ?? quantity;
    let newPrice = (price.split('.').length > 0 && mySymbol?.priceDecimal > 0 && price.split('.')[0]+'.'+price.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0))) ?? price;
    this.binance.sell(orderItem.symbol, newQuantity, newPrice, {type:'LIMIT'}, async (error: any, response: any) => {
      // if(error) console.log('ERRO AO VENDER', error);
      if(!error) {
        console.info("VENDIDO: " + response.orderId);
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
    });
  }

  public async setStopOrder(orderItem: any){
    await OrderSchema.findOneAndUpdate({_id: orderItem._id}, {$set:{ sendStop: true}})
  }

  public async setProfitOrder(orderItem: any){
    await OrderSchema.findOneAndUpdate({_id: orderItem._id}, {$set:{ sendProfit: true}})
  }
  
  public async verifyOpenOrders(symbol: string, price: any, lastCandle: any, symbols: any) {              
                
    var openOrders = await OrderSchema.find({ status: 'OPEN', symbol });
    var floatingEarn = 0;
    var floatingLoss = 0;
    await Promise.all(openOrders.map(async (orderItem: any) => {   
      let priceBuy = orderItem.price * orderItem.quantity;
      let priceNow = price * orderItem.quantity;
      let earnF = priceNow - priceBuy;
      let objetivo = (orderItem.price * orderItem.quantity) * 1.010;
      let trailingStop = await this.trailingStopLoss(orderItem, earnF, price, lastCandle, symbols);
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
            let maxLoss = (orderItem.price - (maxMartinLoss * orderItem.price));
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
                this.binance.buy(symbol, (orderItem.quantity * 1.5).toFixed(1), parseFloat(price).toFixed(3), {type:'LIMIT'}, (error: any, response: any) => {
                  if(error) console.log(error);
                  if(!error) {
                    console.info("Martingale! " + response.orderId);
                    this.createNewOrder(symbol, price, orderItem.quantity * 1.5, 'BUY', 'OPEN', 99);
                  }
                });
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

  public async trailingStopLoss(orderItem: any, earnF: any, price: any, lastCandle: any, symbols: any) {
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
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);
      
    }
    if (atualPrice <= takeLoss) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);;
    }
    if (price >= lastCandle?.high  && balance  >= binanceTax*3 && balance >= 0.1) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);
    }
    return {
      next
    }
  }
}