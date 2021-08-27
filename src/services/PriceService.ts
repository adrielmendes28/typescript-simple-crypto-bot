import CandleStick from '../schemas/CandleStick';

export class PriceService {
  public async getLastPrice(symbol: string): Promise<any> {
    let last = await CandleStick.findOne({symbol: symbol, isFinal: true}).sort({time: -1});
    return last;
  }
}
