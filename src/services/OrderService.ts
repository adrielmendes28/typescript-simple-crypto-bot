import Binance from 'node-binance-api';
import OrderSchema from '../schemas/Order';

export class OrderService {
  private log = require("log-beautify");
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });
  private profitRate = 0.0062713;
  private lossRate = 0.0082713;
  private startAmount = 30;

  public async closeOrder(orderItem: any, earn: any, price: any, symbols: any) {
    let mySymbol = symbols.find((s:any) => s.symbol === orderItem.symbol);
    let myCoin = orderItem.symbol.replace('USDT','');
    this.binance.openOrders(orderItem.symbol, (error:any, openOrders:any, symbol:any) => {
      let mainTrade = openOrders.find((tr: any) => tr.orderId.toString() === orderItem.orderId);
      if(!mainTrade){
        this.binance.balance((error:any, balances:any) => {
          if(error) console.error(error);
          if(!error){
            let newPrice:any = (price.split('.').length >0  && mySymbol?.priceDecimal > 0 && price.split('.')[0]+'.'+price.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0))) ?? price;
            let coinsAvailable = balances[myCoin]?.available;
            let quantity = orderItem.quantity ?? 0;
            if(orderItem.quantity > coinsAvailable) {
              if(coinsAvailable > 0){
                quantity = coinsAvailable
              }
            }

            if(orderItem.quantity < coinsAvailable) {
              if((coinsAvailable - orderItem.quantity) <= 15){
                quantity = coinsAvailable
              }
            }
            let newQuantity = mySymbol?.quantityDecimal > 0 ? quantity.split('.').length >0  &&  quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? 0)) :  parseInt(quantity);
          
            console.log('realQuantity =>', quantity, coinsAvailable, myCoin, orderItem.quantity);
            this.binance.sell(orderItem.symbol, newQuantity, newPrice, {type:'LIMIT'}, async (error: any, response: any) => {
              if(error){
                console.log('ERRO AO VENDER',error)
              };
              if(!error) {
                console.info("VENDIDO: " + response.orderId, earn);
                await this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE',0, response.orderId,this.profitRate, this.lossRate);
                await OrderSchema.findOneAndUpdate({
                  _id: orderItem._id,
                }, {
                  $set: {
                    status: 'FINISH',
                    earn: earn.toString()
                  }
                });
            }
            });
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
      let objetivo = (orderItem.price * orderItem.quantity) * 1.015;
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
            let maxMartinLoss =  0.005;
            let maxLoss = (orderItem.price - (maxMartinLoss * orderItem.price));
            let originalPrice = orderItem.price * orderItem.quantity;
            let takeLoss = (originalPrice) - (originalPrice * maxMartinLoss);
            let atualPrice = (price * orderItem.quantity);
            let mySymbol = symbols.find((s:any) => s.symbol === symbol);
            let quantity:any = (this.startAmount / price).toString();
            let newQuantity =  mySymbol?.quantityDecimal > 0 ? (quantity.split('.').length > 1 && quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? quantity.toFixed()))) :  parseInt(quantity);
            let newPrice = price.split('.').length  > 1  ? price.split('.')[0]+'.'+price.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0)) :  price;
            
            let warningLoss = (orderItem.price - 0.005 * orderItem.price);
            if (price <= warningLoss) this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
                       

            if (atualPrice <= takeLoss) {
              let martinSignal = orderItem.martinSignal + 1;
              if (martinSignal >= 20) {
                this.log.error(`MAX LOSS REACHEAD ${takeLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                this.binance.buy(symbol, newQuantity, newPrice, {type:'LIMIT'}, async (error: any, response: any) => {
                  if(error) console.log(error);
                  if(!error) {
                    console.info("Martingale! " + response.orderId);
                    await OrderSchema.findOneAndUpdate({
                      _id: orderItem._id,
                    }, {
                      $set: {
                        martinGale: 99,
                        martinSignal: 0
                      }
                    });
                    await this.createNewOrder(symbol, price, response.origQty, 'BUY', 'OPEN', 99, response.orderId,this.profitRate, this.lossRate);
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

  private calculateRates(originalPrice: any, profitRate: any, lossRate: any){
    let binanceTax = (originalPrice / 1000) *2;
    let takeProfit = (originalPrice + (originalPrice * profitRate)) + binanceTax;
    let stopLoss = (originalPrice - (originalPrice * lossRate)) + binanceTax;
    return {
      takeProfit,
      stopLoss
    }
  }

  public async createNewOrder(currency: string, price: number, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0, orderId: any, profitRate: number, lossRate: number) {
    let originalPrice = price * quantity;
    let {takeProfit, stopLoss} = this.calculateRates(originalPrice, profitRate, lossRate);
    await OrderSchema.create({
      symbol: currency,
      time: new Date().getTime(),
      price: price.toString(),
      quantity: quantity.toString(),
      status,
      order: order,
      orderId: orderId,
      martinGale: martingale,
      originalPrice,
      takeProfit,
      stopLoss
    });
  }

  public async trailingStopLoss(orderItem: any, earnF: any, price: any, lastCandle: any, symbols: any) {
    let next = true;
    let {originalPrice, stopLoss, takeProfit} = orderItem;
    let binanceTax = (originalPrice / 1000) * 2.1;
    let atualPrice = (price * orderItem.quantity);
    let balance = atualPrice - originalPrice;
   
    if(balance >= binanceTax){
      let update = this.calculateRates(atualPrice, this.profitRate, 0.0012);
      await OrderSchema.findOneAndUpdate({_id: orderItem._id}, {
        $set:{
          stopLoss: update.stopLoss,
          // takeProfit: update.takeProfit
        }
      });
      // takeProfit = update.takeProfit;
      stopLoss = update.stopLoss;
    }
   
    if (atualPrice >= (takeProfit * 0.95)) {
      next = false;
      await this.closeOrder(orderItem, balance.toString(), price, symbols);
    }

    if (atualPrice <= stopLoss) {
      next = false;
      await this.closeOrder(orderItem, balance.toString(), price, symbols);
    }

    if (price >= lastCandle?.high  && balance  >= binanceTax && balance >= 0.1) {
      next = false;
      await this.closeOrder(orderItem, balance.toString(), price, symbols);
    }
    return {
      next
    }
  }
}