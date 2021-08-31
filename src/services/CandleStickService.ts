import Binance from 'node-binance-api';
import Price from '../schemas/Price';
import CandleManagement from "../schemas/CandleManagement"
import Symbol from '../schemas/Symbol';
import { SymbolService } from './SymbolService';
export class CandleStickService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public charts:any = {};
  private ta = require('ta.js');
  private indicators = require('technicalindicators');

  public async calculateStochasticRSI(symbol:string): Promise<any> {
    let candles:any = await CandleManagement.findOne({ symbol: symbol });
    candles = (candles && candles.candles && candles?.candles.sort((a:any, b:any) => a.time - b.time))  ?? [];
    var data = candles.map((candle:any) => candle.close) ?? [];
    let stochasticrsiInput = {
        values: data,
        kPeriod: 3,
        dPeriod: 3,
        stochasticPeriod: 14,
        rsiPeriod: 14,
    }
    return await this.indicators.StochasticRSI.calculate(stochasticrsiInput)
  }

  public async calculateRSI(symbol:string): Promise<any> {
    let candles:any = await CandleManagement.findOne({ symbol: symbol });
  candles = (candles && candles.candles && candles?.candles.sort((a:any, b:any) => a.time - b.time))  ?? [];
  var data = candles.map((candle:any) => candle.close) ?? [];
 
    var data = candles.map((candle:any) => candle.close)?? [];
    var period = 14;
    let rsiInput = {
      values: data,
      period
    }
    let rsi =  await this.indicators.RSI.calculate(rsiInput);
    return rsi[rsi.length -1];
  }

  public async startSocketChartData(): Promise<any> {
    let symbols: any = await new SymbolService().getSymbols();
    symbols = symbols.map((s: any) => s.symbol);
    await Promise.all(symbols.map((s: any) => {
      this.binance.websockets.chart(symbols, "5m", async (symbol: any, interval: any, chart:any) => {
        let tick = this.binance.last(chart);
        let lastCan = chart[tick];
        let candles = Object.keys(chart).map((time: any) => {
            let candle = chart[time];
            let {open,high,low,close, volume, isFinal} = candle;

            return {
                symbol,
                time,
                open,
                high,
                low,
                close, 
                volume, 
                isFinal            
              }
        });
        // await Price.create({symbol, price: parseFloat(lastCan.close), time: parseFloat(tick)});
       
        await CandleManagement.findOneAndUpdate({
          symbol 
        },{symbol, candles:candles},{upsert:true})
      });
    }));
  }

  public async getLastCandle(symbol: string): Promise<any> {
    let last:any = await CandleManagement.findOne({ symbol: symbol });
    return last?.candles[last?.candles.length -1];
  }

}
