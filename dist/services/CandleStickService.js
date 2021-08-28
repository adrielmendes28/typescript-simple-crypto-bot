"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandleStickService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
const CandleManagement_1 = tslib_1.__importDefault(require("../schemas/CandleManagement"));
const SymbolService_1 = require("./SymbolService");
class CandleStickService {
    constructor() {
        this.binance = new node_binance_api_1.default().options({
            APIKEY: process.env.API_KEY,
            APISECRET: process.env.API_SECRET
        });
        this.charts = {};
        this.ta = require('ta.js');
        this.indicators = require('technicalindicators');
    }
    calculateStochasticRSI(symbol) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let candles = yield CandleManagement_1.default.findOne({ symbol: symbol });
            candles = candles === null || candles === void 0 ? void 0 : candles.candles.sort((a, b) => a.time - b.time);
            var data = (_a = candles.map((candle) => candle.close)) !== null && _a !== void 0 ? _a : [];
            let stochasticrsiInput = {
                values: data,
                kPeriod: 3,
                dPeriod: 3,
                stochasticPeriod: 14,
                rsiPeriod: 14,
            };
            return yield this.indicators.StochasticRSI.calculate(stochasticrsiInput);
        });
    }
    calculateRSI(symbol) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let candles = yield CandleManagement_1.default.findOne({ symbol: symbol });
            candles = candles === null || candles === void 0 ? void 0 : candles.candles.sort((a, b) => a.time - b.time);
            var data = (_a = candles.map((candle) => candle.close)) !== null && _a !== void 0 ? _a : [];
            var period = 14;
            let rsiInput = {
                values: data,
                period
            };
            let rsi = yield this.indicators.RSI.calculate(rsiInput);
            return rsi[rsi.length - 1];
        });
    }
    startSocketChartData() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let symbols = yield new SymbolService_1.SymbolService().getSymbols();
            symbols = symbols.map((s) => s.symbol);
            yield Promise.all(symbols.map((s) => {
                this.binance.websockets.chart(symbols, "5m", (symbol, interval, chart) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let tick = this.binance.last(chart);
                    let lastCan = chart[tick];
                    let candles = Object.keys(chart).map((time) => {
                        let candle = chart[time];
                        let { open, high, low, close, volume, isFinal } = candle;
                        return {
                            symbol,
                            time,
                            open,
                            high,
                            low,
                            close,
                            volume,
                            isFinal
                        };
                    });
                    yield CandleManagement_1.default.findOneAndUpdate({
                        symbol
                    }, { symbol, candles: candles }, { upsert: true });
                }));
            }));
        });
    }
    getLastCandle(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let last = yield CandleManagement_1.default.findOne({ symbol: symbol });
            return last === null || last === void 0 ? void 0 : last.candles[(last === null || last === void 0 ? void 0 : last.candles.length) - 1];
        });
    }
}
exports.CandleStickService = CandleStickService;
//# sourceMappingURL=CandleStickService.js.map