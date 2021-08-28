import { CronJob } from 'cron';
import { CandleStickService } from '../services/CandleStickService';
import { TradeService } from '../services/TradeService';
export class TradeJob {
    cronJob: CronJob;
    tradeService = new TradeService();
    candleStickService = new CandleStickService();

    constructor() {
        this.tradeService.startSocketTrade();
        this.candleStickService.startSocketChartData(); 
        this.tradeService.tradeSymbols();
        this.cronJob = new CronJob("*/1 * * * * *", async () => {
            try {
                // await this.tradeService.tradeSymbols();
            } catch (e) {
                console.error(e);
            }
        });
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
    }

}
