import Binance from 'node-binance-api';
import OrderSchema from '../schemas/Order';

export class OrderService {
  private log = require("log-beautify");
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });
  private startAmount = 25;

  public async closeOrder(orderItem: any, earn: any, price: any, symbols: any) {
    let mySymbol = symbols.find((s:any) => s.symbol === orderItem.symbol);
     this.binance.trades(orderItem.symbol, (error:any, trades:any, symbol:any) => {
      let mainTrade = trades.find((tr: any) => tr.orderId.toString() === orderItem.orderId);
      if(mainTrade){
        let { qty,commission } = mainTrade;
        let newPrice:any = (price.split('.').length >0  && mySymbol?.priceDecimal > 0 && price.split('.')[0]+'.'+price.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0))) ?? price;
        let quantity:any = (qty -commission).toString();
        if((quantity * Number(newPrice)) < 10){
          quantity = orderItem.quantity;
        }
        let newQuantity = mySymbol?.quantityDecimal > 0 ? quantity.split('.').length >0  &&  quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? 0)) :  parseInt(quantity);
      
        console.log('realQuantity =>', quantity)
        this.binance.sell(orderItem.symbol, newQuantity, newPrice, {type:'LIMIT'}, async (error: any, response: any) => {
          if(error){
            console.log('ERRO AO VENDER',error)
          };
          if(!error) {
            console.info("VENDIDO: " + response.orderId, earn);
            await this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE',0, response.orderId);
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
            let maxMartinLoss =  0.010;
            let maxLoss = (orderItem.price - (maxMartinLoss * orderItem.price));
            let originalPrice = orderItem.price * orderItem.quantity;
            let takeLoss = (originalPrice) - (originalPrice * maxMartinLoss);
            let atualPrice = (price * orderItem.quantity);
            let mySymbol = symbols.find((s:any) => s.symbol === symbol);
            let quantity:any = (this.startAmount / price).toString();
            let newQuantity =  mySymbol?.quantityDecimal > 0 ? (quantity.split('.').length >0   && quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? 0))) : (mySymbol?.quantityDecimal > 0 ? quantity : parseInt(quantity));
            let newPrice = price.split('.').length >0  ? price.split('.')[0]+'.'+price.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0)) :  price;
            
            let warningLoss = (orderItem.price - 0.005 * orderItem.price);
            if (price <= warningLoss) this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
                       

            if (atualPrice <= takeLoss) {
              let martinSignal = orderItem.martinSignal + 1;
              if (martinSignal >= 10) {
                this.log.error(`MAX LOSS REACHEAD ${takeLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                this.binance.buy(symbol, newQuantity, newPrice, {type:'LIMIT'}, async (error: any, response: any) => {
                  if(error) console.log(error);
                  if(!error) {
                    console.info("Martingale! " + response.orderId);
                    
                    this.createNewOrder(symbol, price, response.origQty, 'BUY', 'OPEN', 99, response.orderId);
                    await OrderSchema.findOneAndUpdate({
                      _id: orderItem._id,
                    }, {
                      $set: {
                        martinGale: 99,
                        martinSignal: 0
                      }
                    });
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

  public async createNewOrder(currency: string, price: number, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0, orderId: any) {
    await OrderSchema.create({
      symbol: currency,
      time: new Date().getTime(),
      price: price.toString(),
      quantity: quantity.toString(),
      status,
      order: order,
      orderId: orderId,
      martinGale: martingale
    });
  }

  public async trailingStopLoss(orderItem: any, earnF: any, price: any, lastCandle: any, symbols: any) {
    let next = true;
    let originalPrice = orderItem.price * orderItem.quantity;
    let binanceTax = (originalPrice / 1000) * 2;
    let takeProfit = (originalPrice + (originalPrice * 0.005)) + binanceTax;
    let takeLoss = (originalPrice - (originalPrice * 0.005)) + binanceTax;
    let atualPrice = (price * orderItem.quantity);
    // console.log(orderItem.symbol,'TP/TL', `${takeProfit}/${takeLoss}`, 'B/NOW', `${originalPrice}/${atualPrice}`)
    let balance = atualPrice - originalPrice;
    
    // console.log(`TP/TL: ${takeProfit.toFixed(2)}/${takeLoss.toFixed(2)}`, `NOW: ${atualPrice.toFixed(2)}`)
    if (atualPrice >= takeProfit) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);
      
    }
    if (atualPrice <= takeLoss) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);
    }
    if (price >= lastCandle?.high  && balance  >= binanceTax*3 && balance >= 0.13) {
      next = false;
      await this.closeOrder(orderItem, earnF.toString(), price, symbols);
    }
    return {
      next
    }
  }
}