"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
const PriceService_1 = require("../services/PriceService");
const OrderService_1 = require("../services/OrderService");
const OrderBookService_1 = require("../services/OrderBookService");
const CandleStickService_1 = require("../services/CandleStickService");
const SymbolService_1 = require("./SymbolService");
class TradeService {
    constructor() {
        this.binance = new node_binance_api_1.default().options({
            APIKEY: process.env.API_KEY,
            APISECRET: process.env.API_SECRET
        });
        this.candleStickService = new CandleStickService_1.CandleStickService;
        this.priceService = new PriceService_1.PriceService;
        this.orderBook = new OrderBookService_1.OrderBookService;
        this.startAmount = 15;
        this.log = require("log-beautify");
        this.orderService = new OrderService_1.OrderService;
    }
    nowRSI(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let stochRSI = yield this.candleStickService.calculateStochasticRSI(symbol);
            let stochRSIVal = stochRSI[stochRSI.length - 1];
            stochRSIVal = {
                overBought: (stochRSIVal === null || stochRSIVal === void 0 ? void 0 : stochRSIVal.stochRSI) >= 80,
                overSold: (stochRSIVal === null || stochRSIVal === void 0 ? void 0 : stochRSIVal.stochRSI) <= 20,
                rsiVal: stochRSIVal === null || stochRSIVal === void 0 ? void 0 : stochRSIVal.stochRSI,
            };
            return {
                haveSignal: stochRSIVal.overSold || stochRSIVal.overBought,
                stoch: {
                    signal: { buy: stochRSIVal.overSold, sell: stochRSIVal.overBought }, value: stochRSIVal.rsiVal
                }
            };
        });
    }
    tradeSymbols() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var lastPrices = yield this.binance.prices();
            var symbols = yield new SymbolService_1.SymbolService().getSymbols();
            var totalLoss = 0;
            var totalWin = 0;
            yield Promise.all(symbols.map((symbol, index) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                var currency = symbol.symbol;
                var lastPrice = lastPrices[currency];
                var lastBook = yield this.orderBook.getLastBook(currency);
                var lastCandle = yield this.candleStickService.getLastCandle(currency);
                var rsiCheck = yield this.nowRSI(currency);
                var { floatingEarn, floatingLoss, openOrders } = yield this.orderService.verifyOpenOrders(currency, lastPrice, lastCandle, symbols);
                totalWin += floatingEarn;
                totalLoss += floatingLoss;
                this.log.info(`${currency} - PRICE: ${lastPrice} - LOW: ${lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.low} - HIGH: ${lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.high} `);
                if (rsiCheck.haveSignal) {
                    let order = rsiCheck.stoch.signal.buy ? 'buy' : 'sell';
                    let buyForce = ((_a = lastBook === null || lastBook === void 0 ? void 0 : lastBook.interest) === null || _a === void 0 ? void 0 : _a.buy) >= 65;
                    let sellForce = ((_b = lastBook === null || lastBook === void 0 ? void 0 : lastBook.interest) === null || _b === void 0 ? void 0 : _b.sell) >= 65;
                    if (order == 'buy' && !sellForce) {
                        if ((lastBook === null || lastBook === void 0 ? void 0 : lastBook.wallsByBids.length) > 0 && lastPrice > lastCandle.low * 1.2) {
                            let betterBid = lastBook === null || lastBook === void 0 ? void 0 : lastBook.bids[0];
                            lastCandle.low = ((lastBook === null || lastBook === void 0 ? void 0 : lastBook.wallsByBids[0]) <= betterBid) ? betterBid : lastBook === null || lastBook === void 0 ? void 0 : lastBook.wallsByBids[0];
                        }
                        let orderPrice = lastCandle.low.toString();
                        this.log.success(`${currency} SIGNAL ${order.toUpperCase()} ON ${orderPrice}USDT`);
                        if (openOrders.length === 0 && parseFloat(lastPrice) <= parseFloat(orderPrice)) {
                            let mySymbol = symbols.find((s) => s.symbol === currency);
                            let quantity = (this.startAmount / orderPrice).toString();
                            let newQuantity = quantity.split('.').length > 0 && (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? quantity.split('.')[0] + '.' + quantity.split('.')[1].substr(0, parseInt((_c = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) !== null && _c !== void 0 ? _c : 0)) : ((mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? quantity : parseInt(quantity));
                            let newPrice = (_e = (orderPrice.split('.').length > 0 && orderPrice.split('.')[0] + '.' + orderPrice.split('.')[1].substr(0, parseInt((_d = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) !== null && _d !== void 0 ? _d : 0)))) !== null && _e !== void 0 ? _e : orderPrice;
                            this.binance.buy(currency, newQuantity, newPrice, { type: 'LIMIT' }, (error, response) => {
                                if (error)
                                    console.log('ERRO AO COMPRAR', error.body, newQuantity);
                                if (!error) {
                                    console.info("Limit Buy placed!", response);
                                    console.info("order id: " + response.orderId);
                                    this.orderService.createNewOrder(currency, orderPrice, response.origQty, 'BUY', 'OPEN', 0, response.orderId);
                                }
                            });
                        }
                    }
                    if (order == 'sell' && !buyForce) {
                        this.log.error(`${currency} SIGNAL ${order.toUpperCase()} AT ` + (lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.high));
                    }
                }
                ;
                if (index + 1 == symbols.length) {
                    this.tradeSymbols();
                }
            })));
            let balance = totalWin + totalLoss;
            if (balance > 0)
                this.log.success(`TOTAL ON OPERATIONS: ${balance}`);
            if (balance < 0)
                this.log.warn(`TOTAL ON OPERATIONS: ${balance.toFixed(3)}USDT`);
        });
    }
    startSocketTrade() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let symbols = yield new SymbolService_1.SymbolService().getSymbols();
            symbols = symbols.map((s) => s.symbol);
            this.binance.websockets.trades(symbols, (trades) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let { e, E, s, p, q, m, a } = trades;
            }));
        });
    }
}
exports.TradeService = TradeService;
//# sourceMappingURL=TradeService.js.map