"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPriceService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
class NewPriceService {
    constructor() {
        this.binance = new node_binance_api_1.default().options({
            APIKEY: '<key>',
            APISECRET: '<secret>'
        });
    }
    getNewPrice(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('symbol', symbol);
            return null;
        });
    }
}
exports.NewPriceService = NewPriceService;
//# sourceMappingURL=SymbolService.js.map