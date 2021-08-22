"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cron_1 = require("cron");
const PriceService_1 = require("src/services/PriceService");
class MonitorJob {
    constructor() {
        this.update = () => {
            const priceService = new PriceService_1.PriceService;
            priceService.getAllSymbolsPrice();
            return null;
        };
        this.cronJob = new cron_1.CronJob("*/1 * * * * *", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.update();
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
const monitorJob = new MonitorJob();
//# sourceMappingURL=MonitorJob.js.map