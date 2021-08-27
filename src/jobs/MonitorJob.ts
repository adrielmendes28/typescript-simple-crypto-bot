import { CronJob } from 'cron';
import { OrderBookService } from '../services/OrderBookService';

export class MonitorJob {
    cronJob: CronJob;

    constructor() {
        const orderBookService = new OrderBookService;
        orderBookService.startOrderBookSocket();
        this.cronJob = new CronJob("*/3 * * * * *", async () => {
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
        const old = new Date().getTime();
        // console.info(`[HeartBeat] Database updated in ${now - old} ms!`);
    }
}
