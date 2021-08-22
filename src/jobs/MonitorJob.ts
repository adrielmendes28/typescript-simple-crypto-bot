import { CronJob } from 'cron';
import { CandleStickService } from '../services/CandleStickService';
import { TradeService } from '../services/TradeService';
import { OrderBookService } from '../services/OrderBookService';
import { PriceService } from '../services/PriceService';

export class MonitorJob {
    cronJob: CronJob;

    constructor() {
        const tradeService = new TradeService();
        const candleStickService = new CandleStickService();
        tradeService.startSocketTrade();
        candleStickService.startSocketCandleStick();

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
        const old = new Date().getTime();
        const priceService = new PriceService;
        const orderBookService = new OrderBookService;
        await priceService.updateSymbols(old);
        await orderBookService.updateOrderBook(old);
        const now = new Date().getTime();

        console.info(`[HeartBeat] Database updated in ${now - old} ms!`);
    }
}
