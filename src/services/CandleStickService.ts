import Binance from 'node-binance-api';
import CandleStick from "../schemas/CandleStick";
import Symbol from '../schemas/Symbol';

export class CandleStickService {
  private binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
  });

  public async startSocketChartData(): Promise<any> {
    let symbols = await Symbol.find();
    await Promise.all(symbols.map((s: any) => {
      this.binance.websockets.chart(s.symbol, "1m", (symbol: string, interval: any, chart: { [x: string]: { close: any; }; }) => {
        let tick = this.binance.last(chart);
        const last = chart[tick].close;
        console.info(chart);
        // Optionally convert 'chart' object to array:
        // let ohlc = binance.ohlc(chart);
        // console.info(symbol, ohlc);
        console.info(symbol + " last price: " + last)
      });
    }));
  }

  public async startSocketCandleStick(): Promise<any> {
    let symbols = await Symbol.find();
    symbols = symbols.map((s: any) => s.symbol);

    this.binance.websockets.candlesticks(symbols, "1m", async (candlesticks: any) => {
      let { E: eventTime, s: symbol, k: ticks } = candlesticks;
      let { t: openTime, T: closeTime, o: open, h: high, l: low, c: close, v: volume, n: trades, i: interval, x: isFinal, q: quoteVolume, V: buyVolume, Q: quoteBuyVolume } = ticks;

      ticks = {
        symbol,
        time: eventTime,
        openTime,
        closeTime,
        open,
        high,
        low,
        close,
        volume,
        trades,
        interval,
        isFinal,
        quoteVolume,
        buyVolume,
        quoteBuyVolume
      };
      await CandleStick.create(ticks);
    });

  }

}
