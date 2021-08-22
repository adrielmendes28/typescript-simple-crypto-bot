"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
class CryptoBotServer {
    constructor() {
        this.setupDatabase();
        this.startJobs();
    }
    startJobs() {
        console.log('Starting jobs..');
    }
    setupDatabase() {
        const connString = "mongodb://localhost:27017/cryptobot";
        mongoose_1.default.connect(connString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
    start() {
        console.log('₵ryptoBOT has started.');
    }
}
exports.default = CryptoBotServer;
("");
//# sourceMappingURL=server.js.map