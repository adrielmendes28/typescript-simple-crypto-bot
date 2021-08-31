import Binance from 'node-binance-api';
import Trade from "../schemas/Trade";
import Symbol from '../schemas/Symbol';
import { PriceService } from '../services/PriceService';
import { OrderService } from '../services/OrderService';
import { OrderBookService } from '../services/OrderBookService';
import { CandleStickService } from '../services/CandleStickService';
import Price from '../schemas/Price';
import { SymbolService } from './SymbolService';

export class TradeService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });
  private candleStickService = new CandleStickService;
  private priceService = new PriceService;
  private orderBook = new OrderBookService;
  private startAmount = 15;
  private log = require("log-beautify");
  private orderService = new OrderService;

  public async nowRSI(symbol: string): Promise<any> {
    let stochRSI = await this.candleStickService.calculateStochasticRSI(symbol);

    let stochRSIVal = stochRSI[stochRSI.length - 1];
    // console.log('stochRSI', stochRSIVal?.stochRSI, symbol);
    stochRSIVal = {
      overBought: stochRSIVal?.stochRSI >= 80,
      overSold: stochRSIVal?.stochRSI <= 40,
      rsiVal: stochRSIVal?.stochRSI,
    };
    return {
      haveSignal: stochRSIVal.overSold || stochRSIVal.overBought,
      stoch: {
        signal: { buy: stochRSIVal.overSold, sell: stochRSIVal.overBought }, value: stochRSIVal.rsiVal
      }
    }
  }


  public async tradeSymbols() {
    var lastPrices = await this.binance.prices();
    var symbols: any = await new SymbolService().getSymbols();
    var totalLoss = 0;
    var totalWin = 0;
    await Promise.all(symbols.map(async (symbol: any, index: number) => {
      var currency = symbol.symbol;      
      var lastPrice = lastPrices[currency];
      
      var lastBook = await this.orderBook.getLastBook(currency);
      var lastCandle = await this.candleStickService.getLastCandle(currency);
      var rsiCheck = await this.nowRSI(currency);
      var { floatingEarn, floatingLoss, openOrders } = await this.orderService.verifyOpenOrders(currency, lastPrice, lastCandle, symbols);

      totalWin += floatingEarn;
      totalLoss += floatingLoss;
      this.log.info(`${currency} - PRICE: ${lastPrice} - LOW: ${lastCandle?.low} - HIGH: ${lastCandle?.high} `);
      if (rsiCheck.haveSignal) {
        let order = rsiCheck.stoch.signal.buy ? 'buy' : 'sell';
        let buyForce = lastBook?.interest?.buy >= 65;
        let sellForce = lastBook?.interest?.sell >= 65;
        if (order == 'buy' && !sellForce) {
          if (lastBook?.wallsByBids.length > 0 && lastPrice > lastCandle.low * 1.2) {
            let betterBid = lastBook?.bids[0];
            lastCandle.low = (lastBook?.wallsByBids[0] <= betterBid) ? betterBid : lastBook?.wallsByBids[0];
          }
          let orderPrice = lastCandle.low.toString();
          this.log.success(`${currency} SIGNAL ${order.toUpperCase()} ON ${orderPrice.toFixed(3)}USDT`);


          if (openOrders.length === 0) {
            let mySymbol = symbols.find((s:any) => s.symbol === currency);
            let quantity:any = (this.startAmount / orderPrice).toString();
            let newQuantity = (quantity.split('.').length > 0 && mySymbol?.quantityDecimal > 0 && quantity.split('.')[0]+'.'+quantity.split('.')[1].substr(0,parseInt(mySymbol?.quantityDecimal ?? 0))) ?? quantity;
            let newPrice = (orderPrice.split('.').length > 0 && mySymbol?.priceDecimal > 0 && orderPrice.split('.')[0]+'.'+orderPrice.split('.')[1].substr(0,parseInt(mySymbol?.priceDecimal ?? 0))) ?? orderPrice;
            
            this.binance.buy(currency, newQuantity, newPrice, {type:'LIMIT'}, (error: any, response: any) => {
              if(error) console.log('ERRO AO COMPRAR');
              if(!error) {
                console.info("Limit Buy placed!", response);
                console.info("order id: " + response.orderId);
                this.orderService.createNewOrder(currency, orderPrice, quantity, 'BUY');
              }
            });
          }
        }
        if (order == 'sell' && !buyForce) {
          this.log.error(`${currency} SIGNAL ${order.toUpperCase()} AT ` + lastCandle?.high);
        }
      };

      if(index+1 == symbols.length){
        this.tradeSymbols();
      }
    }));

    let balance = totalWin + totalLoss;
    if (balance > 0) this.log.success(`TOTAL ON OPERATIONS: ${balance}`);

    if (balance < 0) this.log.warn(`TOTAL ON OPERATIONS: ${balance.toFixed(3)}USDT`);

    
    // await this.tradeSymbols();
  }

  public async startSocketTrade(): Promise<any> {
    
    let symbols: any = await new SymbolService().getSymbols();
    symbols = symbols.map((s: any) => s.symbol);

    this.binance.websockets.trades(symbols, async (trades: any) => {
      let { e, E, s, p, q, m, a } = trades;
      // await Trade.create({
      //   eventType: e,
      //   time: E,
      //   symbol: s,
      //   price: p,
      //   qty: q,
      //   total: parseFloat(p) * parseFloat(q),
      //   maker: m,
      //   tradeId: a
      // });

      // await Price.create({symbol: s, price: parseFloat(p), time: E});
      // await this.tradeSymbols();
    });
  }
}
