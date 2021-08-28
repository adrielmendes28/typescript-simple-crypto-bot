"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const tslib_1 = require("tslib");
const Price_1 = tslib_1.__importDefault(require("../schemas/Price"));
class PriceService {
    getLastPrice(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let last = yield Price_1.default.findOne({ symbol: symbol }).sort({ createdAt: -1 });
            return last;
        });
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=PriceService.js.map