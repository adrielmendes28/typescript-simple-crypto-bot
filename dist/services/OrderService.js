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
        this.profitRate = 0.0262713;
        this.lossRate = 0.0082713;
        this.startAmount = 30;
    }
    closeOrder(orderItem, earn, price, symbols) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let mySymbol = symbols.find((s) => s.symbol === orderItem.symbol);
            let myCoin = orderItem.symbol.replace('USDT', '');
            this.binance.openOrders(orderItem.symbol, (errorOpenDoors, openOrders, symbol) => {
                let mainTrade = openOrders.find((tr) => tr.orderId.toString() === orderItem.orderId);
                if (!mainTrade) {
                    this.binance.balance((errorBalance, balances) => {
                        var _a, _b, _c, _d, _e;
                        if (errorBalance)
                            console.error(errorBalance.body);
                        if (!errorBalance) {
                            let newPrice = (_b = (price.split('.').length > 0 && (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) > 0 && price.split('.')[0] + '.' + price.split('.')[1].substr(0, parseInt((_a = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) !== null && _a !== void 0 ? _a : 0)))) !== null && _b !== void 0 ? _b : price;
                            let coinsAvailable = (_c = balances[myCoin]) === null || _c === void 0 ? void 0 : _c.available;
                            let quantity = (_d = orderItem.quantity) !== null && _d !== void 0 ? _d : 0;
                            if (orderItem.quantity > coinsAvailable) {
                                if (coinsAvailable > 0) {
                                    quantity = coinsAvailable;
                                }
                            }
                            if (coinsAvailable > orderItem.quantity) {
                                if (((parseFloat(coinsAvailable) - parseFloat(orderItem.quantity)) * parseFloat(newPrice)) < (this.startAmount / 2)) {
                                    quantity = coinsAvailable;
                                }
                            }
                            let newQuantity = (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? quantity.split('.').length > 0 && quantity.split('.')[0] + '.' + quantity.split('.')[1].substr(0, parseInt((_e = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) !== null && _e !== void 0 ? _e : 0)) : parseInt(quantity);
                            console.log('realQuantity =>', quantity, coinsAvailable, myCoin, orderItem.quantity);
                            this.binance.sell(orderItem.symbol, newQuantity, newPrice, { type: 'LIMIT' }, (errorSell, response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                if (errorSell) {
                                    console.log('ERRO AO VENDER', errorSell.body);
                                }
                                ;
                                if (!errorSell) {
                                    console.info("VENDIDO: " + response.orderId, earn);
                                    yield this.createNewOrder(orderItem.symbol, price, orderItem.quantity, 'SELL', 'CLOSE', 0, response.orderId, this.profitRate, this.lossRate);
                                    yield Order_1.default.findOneAndUpdate({
                                        _id: orderItem._id,
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
            yield Promise.all(openOrders.map((orderItem) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.binance.openOrders(symbol, (errorOpenDoors, openOrderss, symbol) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let mainTrade = JSON.parse(JSON.stringify(openOrderss)).find((tr) => tr.orderId.toString() === orderItem.orderId);
                    if (!mainTrade) {
                        yield Order_1.default.findOneAndUpdate({ _id: orderItem._id }, { $set: {
                                active: true
                            } });
                    }
                }));
            })));
            var activeOrders = yield Order_1.default.find({ status: 'OPEN', symbol, active: true });
            var floatingEarn = 0;
            var floatingLoss = 0;
            yield Promise.all(activeOrders.map((orderItem) => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                            let maxMartinLoss = 0.005;
                            let maxLoss = (orderItem.price - (maxMartinLoss * orderItem.price));
                            let originalPrice = orderItem.price * orderItem.quantity;
                            let takeLoss = (originalPrice) - (originalPrice * maxMartinLoss);
                            let atualPrice = (price * orderItem.quantity);
                            let mySymbol = symbols.find((s) => s.symbol === symbol);
                            let quantity = (this.startAmount / price).toString();
                            let newQuantity = (mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) > 0 ? (quantity.split('.').length > 1 && quantity.split('.')[0] + '.' + quantity.split('.')[1].substr(0, parseInt((_a = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.quantityDecimal) !== null && _a !== void 0 ? _a : quantity.toFixed()))) : parseInt(quantity);
                            let newPrice = price.split('.').length > 1 ? price.split('.')[0] + '.' + price.split('.')[1].substr(0, parseInt((_b = mySymbol === null || mySymbol === void 0 ? void 0 : mySymbol.priceDecimal) !== null && _b !== void 0 ? _b : 0)) : price;
                            let warningLoss = (orderItem.price - 0.005 * orderItem.price);
                            if (price <= warningLoss)
                                this.log.warn('MAX LOSS ', maxLoss, 'BUY AT ', orderItem.price);
                            if (atualPrice <= takeLoss) {
                                let martinSignal = orderItem.martinSignal + 1;
                                if (martinSignal >= 20) {
                                    this.log.error(`MAX LOSS REACHEAD ${takeLoss} OPENING MARTINGALE ${orderItem.martinGale + 1}`);
                                    this.binance.buy(symbol, newQuantity, newPrice, { type: 'LIMIT' }, (error, response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                        if (error)
                                            console.log(error);
                                        if (!error) {
                                            console.info("Martingale! " + response.orderId);
                                            yield Order_1.default.findOneAndUpdate({
                                                _id: orderItem._id,
                                            }, {
                                                $set: {
                                                    martinGale: 99,
                                                    martinSignal: 0
                                                }
                                            });
                                            yield this.createNewOrder(symbol, price, response.origQty, 'BUY', 'OPEN', 99, response.orderId, this.profitRate, this.lossRate);
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
    calculateRates(originalPrice, profitRate, lossRate) {
        let binanceTax = (originalPrice / 1000) * 2;
        let takeProfit = (originalPrice + (originalPrice * profitRate)) + binanceTax;
        let stopLoss = (originalPrice - (originalPrice * lossRate)) + binanceTax;
        return {
            takeProfit,
            stopLoss
        };
    }
    createNewOrder(currency, price, quantity = 4, order = 'SELL', status = 'OPEN', martingale = 0, orderId, profitRate, lossRate) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let originalPrice = price * quantity;
            let { takeProfit, stopLoss } = this.calculateRates(originalPrice, profitRate, lossRate);
            yield Order_1.default.create({
                symbol: currency,
                time: new Date().getTime(),
                price: price.toString(),
                quantity: quantity.toString(),
                status,
                order: order,
                orderId: orderId,
                martinGale: martingale,
                originalPrice,
                takeProfit,
                stopLoss
            });
        });
    }
    trailingStopLoss(orderItem, earnF, price, lastCandle, symbols) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let next = true;
            let { originalPrice, stopLoss, takeProfit } = orderItem;
            let binanceTax = (originalPrice / 1000) * 2.5;
            let atualPrice = (price * orderItem.quantity);
            let balance = atualPrice - originalPrice;
            if (balance >= binanceTax) {
                let update = this.calculateRates(atualPrice, this.profitRate, 0.002713);
                if (update.stopLoss > stopLoss) {
                    yield Order_1.default.findOneAndUpdate({ _id: orderItem._id }, {
                        $set: {
                            stopLoss: update.stopLoss.toString()
                        }
                    });
                    stopLoss = update.stopLoss;
                }
            }
            if (atualPrice >= takeProfit) {
                next = false;
                yield this.closeOrder(orderItem, balance.toString(), price, symbols);
            }
            if (atualPrice <= stopLoss) {
                next = false;
                yield this.closeOrder(orderItem, balance.toString(), price, symbols);
            }
            if (price >= (lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.high) && balance >= binanceTax && balance >= 0.1) {
                next = false;
                yield this.closeOrder(orderItem, balance.toString(), price, symbols);
            }
            return {
                next
            };
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map