"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeJob = void 0;
const tslib_1 = require("tslib");
const cron_1 = require("cron");
const CandleStickService_1 = require("../services/CandleStickService");
const TradeService_1 = require("../services/TradeService");
class TradeJob {
    constructor() {
        this.tradeService = new TradeService_1.TradeService();
        this.candleStickService = new CandleStickService_1.CandleStickService();
        this.tradeService.startSocketTrade();
        this.candleStickService.startSocketChartData();
        this.tradeService.tradeSymbols();
        this.cronJob = new cron_1.CronJob("*/1 * * * * *", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
            }
            catch (e) {
                console.error(e);
            }
        }));
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
    }
}
exports.TradeJob = TradeJob;
//# sourceMappingURL=TradeJob.js.map