import Price from '../schemas/Price';

export class PriceService {
  public async getLastPrice(symbol: string): Promise<any> {
    let last = await Price.findOne({symbol: symbol}).sort({createdAt: -1});
    return last;
  }
}
