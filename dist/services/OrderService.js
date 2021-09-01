"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
const Order_1 = tslib_1.__importDefault(require("../schemas/Order"));
class OrderService {
    constructor() {
        this.log = require("log-beautify");
        this.binance = new node_binance_api_1.default().options({
            APIKEY: process.env.API_KEY,
            APISECRET: process.env.API_SECRET
        });
        this.startAmount = 25;
    }
    closeOrder(orderItem, earn, price, symbols) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let mySymbol = symbols.find((s) => s.symbol === orderItem.symbol);
            this.binance.trades(orderItem.symbol, (error, trades, symbol) => {
                var _a, _b, _c;
                let mainTrade = trades.find((tr) => tr.orderId.toString() === orderItem.orderId);
                if (mainTrade) {
                    let { qty, commission } = mainTrade;
                    let newPrice = (_b = (price.split('.').length > 0 && (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) > 0 && price.split('.')[0] + '.' + price.split('.')[1].substr(0, parseInt((_a = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) !== null && _a !== void 0 ? _a : 0)))) !== null && _b !== void 0 ? _b : price;
                    let quantity = (qty - commission).toString();
                    if ((quantity * Number(newPrice)) < 10) {
                        quantity = orderItem.quantity;
                    }
                    let newQuantity = (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? quantity.split('.').length > 0 && quantity.split('.')[0] + '.' + quantity.split('.')[1].substr(0, parseInt((_c = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) !== null && _c !== void 0 ? _c : 0)) : parseInt(quantity);
                    console.log('realQuantity =>', quantity);
                    this.binance.sell(orderItem.symbol, newQuantity, newPrice, { type: 'LIMIT' }, (error, response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            console.log('ERRO AO VENDER', error);
                        }
                        ;
                        if (!error) {
                            console.info("VENDIDO: " + response.orderId, earn);
                            yield this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE', 0, response.orderId);
                            yield Order_1.default.findOneAndUpdate({
                                _id: orderItem._id,
                                symbol: orderItem.symbol,
                                status: 'OPEN'
                            }, {
                                $set: {
                                    status: 'FINISH',
                                    earn: earn.toString()
                                }
                            });
                        }
                    }));
                }
            });
        });
    }
    setStopOrder(orderItem) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Order_1.default.findOneAndUpdate({ _id: orderItem._id }, { $set: { sendStop: true } });
        });
    }
    setProfitOrder(orderItem) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Order_1.default.findOneAndUpdate({ _id: orderItem._id }, { $set: { sendProfit: true } });
        });
    }
    verifyOpenOrders(symbol, price, lastCandle, symbols) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var openOrders = yield Order_1.default.find({ status: 'OPEN', symbol });
            var floatingEarn = 0;
            var floatingLoss = 0;
            yield Promise.all(openOrders.map((orderItem) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let priceBuy = orderItem.price * orderItem.quantity;
                let priceNow = price * orderItem.quantity;
                let earnF = priceNow - priceBuy;
                let objetivo = (orderItem.price * orderItem.quantity) * 1.015;
                let trailingStop = yield this.trailingStopLoss(orderItem, earnF, price, lastCandle, symbols);
                var localLoss = 0;
                var localEarn = 0;
                if (trailingStop.next) {
                    if (earnF > 0) {
                        floatingEarn += earnF;
                        localEarn = earnF;
                    }
                    if (earnF < 0) {
                        localLoss = earnF;
                        floatingLoss += earnF;
                        if (price <= orderItem.price && orderItem.martinGale < 3) {
                            let maxMartinLoss = 0.010;
                            let maxLoss = (orderItem.price - (maxMartinLoss * orderItem.price));
                            let originalPrice = orderItem.price * orderItem.quantity;
                            let takeLoss = (originalPrice) - (originalPrice * maxMartinLoss);
                            let atualPrice = (price * orderItem.quantity);
                            let mySymbol = symbols.find((s) => s.symbol === symbol);
                            let quantity = (this.startAmount / price).toString();
                            let newQuantity = (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? (quantity.split('.').length > 0 && quantity.split('.')[0] + '.' + quantity.split('.')[1].substr(0, parseInt((_a = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) !== null && _a !== void 0 ? _a : 0))) : ((mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? quantity : parseInt(quantity));
                            let newPrice = price.split('.').length > 0 ? price.split('.')[0] + '.' + price.split('.')[1].substr(0, parseInt((_b = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) !== null && _b !== void 0 ? _b : 0)) : price;
                            let warningLoss = (orderItem.price - 0.005 * orderItem.price);
                            if (price <= warningLoss)
                                this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
                            if (atualPrice <= takeLoss) {
                                let martinSignal = orderItem.martinSignal + 1;
                                if (martinSignal >= 10) {
                                    this.log.error(`MAX LOSS REACHEAD ${takeLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                                    this.binance.buy(symbol, newQuantity, newPrice, { type: 'LIMIT' }, (error, response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                        if (error)
                                            console.log(error);
                                        if (!error) {
                                            console.info("Martingale! " + response.orderId);
                                            this.createNewOrder(symbol, price, response.origQty, 'BUY', 'OPEN', 99, response.orderId);
                                            yield Order_1.default.findOneAndUpdate({
                                                _id: orderItem._id,
                                            }, {
                                                $set: {
                                                    martinGale: 99,
                                                    martinSignal: 0
                                                }
                                            });
                                        }
                                    }));
                                }
                                else {
                                    yield Order_1.default.findOneAndUpdate({
                                        _id: orderItem._id,
                                    }, {
                                        $set: {
                                            martinSignal
                                        }
                                    });
                                }
                            }
                        }
                        ;
                    }
                    ;
                    if (localEarn > 0) {
                        this.log.success(`[${symbol}]`, 'START:', priceBuy.toFixed(3), 'POSITION RESULT', (earnF + priceBuy).toFixed(3), 'GOAL', objetivo.toFixed(3), `WIN: ${localEarn.toFixed(3)}USDT - LOSS: ${localLoss.toFixed(3)}USDT`);
                    }
                    else {
                        this.log.error(`[${symbol}]`, 'START:', priceBuy.toFixed(3), 'POSITION RESULT', (earnF + priceBuy).toFixed(3), 'GOAL', objetivo.toFixed(3), `WIN: ${localEarn.toFixed(3)}USDT - LOSS: ${localLoss.toFixed(3)}USDT`);
                    }
                }
            })));
            return {
                openOrders,
                floatingLoss,
                floatingEarn
            };
        });
    }
    createNewOrder(currency, price, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0, orderId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Order_1.default.create({
                symbol: currency,
                time: new Date().getTime(),
                price: price.toString(),
                quantity: quantity.toString(),
                status,
                order: order,
                orderId: orderId,
                martinGale: martingale
            });
        });
    }
    trailingStopLoss(orderItem, earnF, price, lastCandle, symbols) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let next = true;
            let originalPrice = orderItem.price * orderItem.quantity;
            let binanceTax = (originalPrice / 1000) * 2;
            let takeProfit = (originalPrice + (originalPrice * 0.005)) + binanceTax;
            let takeLoss = (originalPrice - (originalPrice * 0.005)) + binanceTax;
            let atualPrice = (price * orderItem.quantity);
            let balance = atualPrice - originalPrice;
            if (atualPrice >= takeProfit) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price, symbols);
            }
            if (atualPrice <= takeLoss) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price, symbols);
            }
            if (price >= (lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.high) && balance >= binanceTax * 3 && balance >= 0.13) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price, symbols);
            }
            return {
                next
            };
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map