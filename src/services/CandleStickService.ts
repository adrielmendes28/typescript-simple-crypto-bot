import Binance from 'node-binance-api';
import CandleStick from "../schemas/CandleStick";
import Symbol from '../schemas/Symbol';

export class CandleStickService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async calculateStochastic(): Promise<any> {
    
  }

  public async calculateRSI(candles: any): Promise<any> {
    const RSI = require('technicalindicators').RSI;
    const values = candles.map((candle:any) => candle.close);
    const inputRSI = {
      values,
      period : 14
    };

     return RSI.calculate(inputRSI);
  }

  public async startSocketChartData(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);
    await Promise.all(symbols.map((s: any) => {
      this.binance.websockets.chart(symbols, "5m", async (symbol: any, interval: any, chart:any) => {
        let tick = this.binance.last(chart);
        let lastPrice = chart[tick].close;
        let lastCandles:any = Object.keys(chart).slice(Object.keys(chart).length-15,Object.keys(chart).length-1);
        lastCandles = lastCandles.map((candleKey:any) => {
          let candle = chart[candleKey];
          let {open,high,low,close} = candle;
          return {
            open,
            high,
            low,
            close, 
          }
        });
        let nowRSI = this.calculateRSI(lastCandles);
        console.log(nowRSI);
        console.log(lastCandles);
        console.log(lastCandles.length);
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
