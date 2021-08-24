import { CronJob } from 'cron';
import { CandleStickService } from '../services/CandleStickService';
import { TradeService } from '../services/TradeService';
export class TradeJob {
    cronJob: CronJob;
    tradeService = new TradeService();
    candleStickService = new CandleStickService();

    constructor() {
        this.tradeService.startSocketTrade();
        this.candleStickService.startSocketCandleStick();
        // this.candleStickService.startSocketChartData();
        this.cronJob = new CronJob("*/1 * * * * *", async () => {
            try {
                await this.start();
            } catch (e) {
                console.error(e);
            }
        });
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
    }

    private start = async () => {
        this.tradeService.tradeSymbols();
        return null
    }
}
