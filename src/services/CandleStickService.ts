import Binance from 'node-binance-api';
import CandleStick from "../schemas/CandleStick";
import Symbol from '../schemas/Symbol';
import Price from '../schemas/Price';

export class CandleStickService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async startSocketChartData(): Promise<any> {
    let symbols = await Symbol.find();
    await Promise.all(symbols.map((s: any) => {
      this.binance.websockets.chart(s.symbol, "5m", async (symbol: string, interval: any, chart: { [x: string]: { close: any; }; }) => {
        let tick = this.binance.last(chart);
        const last = chart[tick];
        // console.info( last );
      });
    }));
  }

  public async startSocketCandleStick(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);

    this.binance.websockets.candlesticks(symbols, "5m", async (candlesticks: any) => {
      const { E, s, k } = candlesticks;
      const { t, T, o, h, l, c, v, n, i, x, q, V, Q } = k;
      // console.log(E);
      const ticks = {
        openTime: t,
        closeTime: T,
        time: E,
        symbol: s,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
        trades: n,
        interval: i,
        isFinal: x,
        quoteVolume: q,
        buyVolume: V,
        quoteBuyVolume: Q
      };
      await CandleStick.create(ticks);
    });

  }

  
  public async getLastCandle(symbol: string): Promise<any> {
    let last = await CandleStick.findOne({ symbol: symbol }).sort({ time: -1 });
    return last;
  }

}
