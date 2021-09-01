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
                yield Symbol_1.default.insertMany([
                    {
                        "symbol": "ADAUSDT",
                        "priceDecimal": 3.0,
                        "quantityDecimal": 1.0
                    },
                    {
                        "symbol": "BTCUSDT",
                        "priceDecimal": 2.0,
                        "quantityDecimal": 5.0
                    },
                    {
                        "symbol": "XRPUSDT",
                        "priceDecimal": 4.0,
                        "quantityDecimal": 0.0
                    },
                    {
                        "symbol": "RSRUSDT",
                        "priceDecimal": 4.0,
                        "quantityDecimal": 1.0
                    },
                    {
                        "symbol": "ETHUSDT",
                        "priceDecimal": 2.0,
                        "quantityDecimal": 4.0
                    },
                    {
                        "symbol": "DOGEUSDT",
                        "priceDecimal": 4.0,
                        "quantityDecimal": 0.0
                    },
                    {
                        "symbol": "DODOUSDT",
                        "priceDecimal": 3.0,
                        "quantityDecilmal": 1.0
                    },
                    {
                        "symbol": "AIONUSDT",
                        "priceDecimal": 4.0,
                        "quantityDecilmal": 0.0
                    },
                    {
                        "symbol": "TRXUSDT",
                        "priceDecimal": 5.0,
                        "quantityDecilmal": 1.0
                    }
                ]);
            symbols = yield Symbol_1.default.find({});
            return symbols;
        });
    }
}
exports.SymbolService = SymbolService;
//# sourceMappingURL=SymbolService.js.map