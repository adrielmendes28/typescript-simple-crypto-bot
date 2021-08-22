"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cron_1 = require("cron");
class TradeJob {
    constructor() {
        this.bar = () => {
            return null;
        };
        this.cronJob = new cron_1.CronJob("* * * * *", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.bar();
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
const tradeJob = new TradeJob();
//# sourceMappingURL=TradeJob.js.map