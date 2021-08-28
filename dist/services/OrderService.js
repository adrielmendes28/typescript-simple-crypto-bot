"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const tslib_1 = require("tslib");
const Order_1 = tslib_1.__importDefault(require("../schemas/Order"));
class OrderService {
    constructor() {
        this.log = require("log-beautify");
    }
    closeOrder(orderItem, earn, price) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE');
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
        });
    }
    verifyOpenOrders(symbol, price, lastCandle) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var openOrders = yield Order_1.default.find({ status: 'OPEN', symbol });
            var floatingEarn = 0;
            var floatingLoss = 0;
            yield Promise.all(openOrders.map((orderItem) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let priceBuy = orderItem.price * orderItem.quantity;
                let priceNow = price * orderItem.quantity;
                let earnF = priceNow - priceBuy;
                let objetivo = (orderItem.price * orderItem.quantity) * 1.010;
                let trailingStop = yield this.trailingStopLoss(orderItem, earnF, price, lastCandle);
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
                        let checkAgain = yield Order_1.default.find({ status: 'OPEN', symbol });
                        if (price <= orderItem.price && orderItem.martinGale < 3 && checkAgain.length < 2) {
                            let maxMartinLoss = orderItem.martinGale == 0 ? 0.005 * orderItem.price : (orderItem.martinGale == 1 ? 0.010 * orderItem.price : (orderItem.martinGale == 2 ? 0.035 * orderItem.price : 0.04 * orderItem.price));
                            let maxLoss = (orderItem.price - maxMartinLoss);
                            let warningLoss = (orderItem.price - 0.003 * orderItem.price);
                            if (price <= warningLoss)
                                this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
                            if (price <= maxLoss) {
                                let martinSignal = orderItem.martinSignal + 1;
                                if (martinSignal >= 10) {
                                    yield Order_1.default.findOneAndUpdate({
                                        _id: orderItem._id,
                                    }, {
                                        $set: {
                                            martinGale: orderItem.martinGale + 1,
                                            martinSignal: 0
                                        }
                                    });
                                    this.log.error(`MAX LOSS REACHEAD ${maxMartinLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                                    yield this.createNewOrder(symbol, price, orderItem.quantity * 2, 'BUY', 'OPEN', 99);
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
    createNewOrder(currency, price, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Order_1.default.create({
                symbol: currency,
                time: new Date().getTime(),
                price: price.toString(),
                quantity: quantity.toString(),
                status,
                order: order,
                martinGale: martingale
            });
        });
    }
    trailingStopLoss(orderItem, earnF, price, lastCandle) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let next = true;
            let originalPrice = orderItem.price * orderItem.quantity;
            let binanceTax = originalPrice / 1000;
            let takeProfit = originalPrice * 1.010;
            let takeLoss = originalPrice - (originalPrice * 0.015);
            let atualPrice = (price * orderItem.quantity);
            let balance = atualPrice - originalPrice;
            if (atualPrice >= takeProfit) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price);
            }
            if (atualPrice <= takeLoss) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price);
                ;
            }
            if (price >= (lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.high)) {
                next = false;
                yield this.closeOrder(orderItem, earnF.toString(), price);
                ;
            }
            return {
                next
            };
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map