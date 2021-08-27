import Binance from 'node-binance-api';
import CandleStick from "../schemas/CandleStick";
import Symbol from '../schemas/Symbol';

export class CandleStickService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  private ta = require('ta.js');
  private indicators = require('technicalindicators');

  public async calculateStochasticRSI(symbol:string): Promise<any> {
    let candles = await CandleStick.find({ symbol: symbol }).sort({ time: -1 }).limit(500);
    candles = candles.sort((a:any, b:any) => a.time - b.time);
    var data = candles.map((candle:any) => candle.close);
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
    let candles = await CandleStick.find({ symbol: symbol }).sort({ time: -1 }).limit(500);
    candles = candles.sort((a:any, b:any) => a.time - b.time);
    var data = candles.map((candle:any) => candle.close);
    var period = 14;
    let rsiInput = {
      values: data,
      period
    }
    let rsi =  await this.indicators.RSI.calculate(rsiInput);
    return rsi[rsi.length -1];
  }

  public async startSocketChartData(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);
    await Promise.all(symbols.map((s: any) => {
      this.binance.websockets.chart(symbols, "5m", async (symbol: any, interval: any, chart:any) => {
        let tick = this.binance.last(chart);
        await Object.keys(chart).map(async (time: any) => {
          let candle = chart[time];
          let {open,high,low,close, volume, isFinal} = candle;
          await CandleStick.findOneAndUpdate(
            { 
              symbol,
              time,
            }, 
            {
              symbol,
              time,
              open,
              high,
              low,
              close, 
              volume, 
              isFinal            
            }, 
            { upsert: true }
          )
        });
      });
    }));
  }

  public async getLastCandle(symbol: string): Promise<any> {
    let last = await CandleStick.findOne({ symbol: symbol }).sort({ time: -1 });
    return last;
  }

}
