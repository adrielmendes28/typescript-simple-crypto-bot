import { CronJob } from 'cron';

export class TradeJob {
    cronJob: CronJob;

    constructor() {
        this.cronJob = new CronJob("* * * * *", async () => {
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

    private start = () => {
        return null
    }
}
