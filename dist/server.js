"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const MonitorJob_1 = require("./jobs/MonitorJob");
const TradeJob_1 = require("./jobs/TradeJob");
class CryptoBotServer {
    constructor() {
        this.setupDatabase();
        this.startJobs();
    }
    startJobs() {
        console.log('Starting jobs..');
        new MonitorJob_1.MonitorJob();
        new TradeJob_1.TradeJob();
    }
    setupDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const connString = "mongodb://localhost:27017/cryptobot";
            mongoose_1.default.connect(connString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            });
        });
    }
    start() {
        console.log('₵ryptoBOT has started. ' + new Date().toString());
    }
}
exports.default = CryptoBotServer;
("");
//# sourceMappingURL=server.js.map