import { CronJob } from 'cron';
import { FutureTradeService } from '../services/FutureTradeService';

export class MonitorJob {
    cronJob: CronJob;
    private futureTradeService = new FutureTradeService;

    constructor() {
        this.cronJob = new CronJob("*/1 * * * * *", async () => {
            try {
                await this.update();
            } catch (e) {
                console.error(e);
            }
        });
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
    }

    private update = async () => {
        this.futureTradeService.startOrderMonitor();
    }
}
