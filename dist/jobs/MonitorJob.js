"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorJob = void 0;
const tslib_1 = require("tslib");
const cron_1 = require("cron");
const OrderBookService_1 = require("../services/OrderBookService");
class MonitorJob {
    constructor() {
        this.update = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const old = new Date().getTime();
        });
        const orderBookService = new OrderBookService_1.OrderBookService;
        orderBookService.startOrderBookSocket();
        this.cronJob = new cron_1.CronJob("*/3 * * * * *", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
exports.MonitorJob = MonitorJob;
//# sourceMappingURL=MonitorJob.js.map