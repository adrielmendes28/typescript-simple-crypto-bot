"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolService = void 0;
const tslib_1 = require("tslib");
const Symbol_1 = tslib_1.__importDefault(require("../schemas/Symbol"));
class SymbolService {
    getSymbols() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let symbols = yield Symbol_1.default.find({});
            if (symbols.length == 0)
                yield Symbol_1.default.insertMany([{ symbol: 'ADAUSDT' }, { symbol: 'BTTUSDT' }, { symbol: 'DOGEUSDT' }]);
            symbols = yield Symbol_1.default.find({});
            return symbols;
        });
    }
}
exports.SymbolService = SymbolService;
//# sourceMappingURL=SymbolService.js.map