"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
class PriceService {
    constructor() {
        this.binance = new node_binance_api_1.default().options({
            APIKEY: '3IxaGjA768Hf9zcAcNI1pAcaP5kSjIubrIAe3CqLhiJeQ7Hw7rFoXXGXk3HFCdSd',
            APISECRET: process.env.API_SECRET
        });
    }
    getAllSymbolsPrice() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('[HeartBeat] Updating all Symbol prices.');
            let ticker = yield this.binance.prices();
            console.log(ticker);
            return null;
        });
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=PriceService.js.map