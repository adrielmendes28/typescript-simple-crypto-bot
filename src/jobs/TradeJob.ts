import { CandleStickService } from '../services/CandleStickService';
import { TradeService } from '../services/TradeService';

export class TradeJob {
    tradeService = new TradeService();
    candleStickService = new CandleStickService();

    constructor() {
        this.tradeService.startSocketTrade();
        this.candleStickService.startSocketChartData();
    }
}
