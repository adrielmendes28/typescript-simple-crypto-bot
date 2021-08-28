"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookService = void 0;
const tslib_1 = require("tslib");
const node_binance_api_1 = tslib_1.__importDefault(require("node-binance-api"));
const OrderBook_1 = tslib_1.__importDefault(require("../schemas/OrderBook"));
const orderbook_analysis_1 = require("orderbook-analysis");
const SymbolService_1 = require("./SymbolService");
class OrderBookService {
    constructor() {
        this.binance = new node_binance_api_1.default().options({
            APIKEY: process.env.API_KEY,
            APISECRET: process.env.API_SECRET
        });
    }
    bookJsonToArray(book) {
        return Object.keys(book).map(key => {
            return [key, book[key]];
        });
    }
    startOrderBookSocket() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let symbols = yield new SymbolService_1.SymbolService().getSymbols();
            symbols = symbols.map((s) => s.symbol);
            yield this.binance.websockets.depthCache(symbols, (symbol, depth) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let bids = this.binance.sortBids(depth.bids);
                let asks = this.binance.sortAsks(depth.asks);
                let asksArray = this.bookJsonToArray(asks);
                let bidsArray = this.bookJsonToArray(bids);
                let orderBookRaw = {
                    time: depth.eventTime,
                    lastUpdateId: depth.lastUpdateId,
                    asks: asksArray,
                    bids: bidsArray
                };
                yield this.updateOrderBook(depth.eventTime, orderBookRaw, symbol);
            }));
        });
    }
    normalizePureBook(bidAsk, order, maxLength) {
        let book = [];
        let amountAll = 0;
        let totalAll = 0;
        bidAsk.forEach((valueArray, index) => {
            let price = parseFloat(valueArray[0]);
            let qty = parseFloat(valueArray[1]);
            let total = price * qty;
            let bookItem = {
                position: index,
                price,
                qty,
                total,
                order: order
            };
            totalAll += total !== null && total !== void 0 ? total : 0;
            amountAll += qty !== null && qty !== void 0 ? qty : 0;
            book.push(bookItem);
        });
        return {
            totalAll,
            amountAll,
            book
        };
    }
    getSymbolOrderBook(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let ticker = yield this.binance.depth(symbol);
            return ticker;
        });
    }
    updateOrderBook(time, orderBookRaw, symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                let orderBook = new orderbook_analysis_1.OBA(orderBookRaw);
                let spread = orderBook.calc('spread');
                let { bids, asks } = orderBookRaw;
                let maxLength = bids.length > asks.length ? asks.length : bids.length;
                bids = yield this.normalizePureBook(bids, 'BUY', maxLength);
                asks = yield this.normalizePureBook(asks, 'SELL', maxLength);
                let amountBuy = bids.amountAll;
                let amountSell = asks.amountAll;
                let totalAll = amountBuy + amountSell;
                let buyPercentage = (amountBuy / totalAll) * 100;
                let sellPercentage = (amountSell / totalAll) * 100;
                let sellMedianPrice = orderBook.calc('medianByAsksPrice');
                let buyMedianPrice = orderBook.calc('medianByBidsPrice');
                let depthByPercent = orderBook.calc('depthByPercent');
                let lastMarketDepth = {
                    symbol: symbol,
                    depthByPercent: {
                        up: depthByPercent.up / (depthByPercent.up + depthByPercent.down) * 100,
                        down: depthByPercent.down / (depthByPercent.up + depthByPercent.down) * 100
                    },
                    asks: asks.book.slice(0, 3),
                    bids: bids.book.slice(0, 3),
                    spread,
                    median: {
                        buy: buyMedianPrice, sell: sellMedianPrice
                    },
                    interest: {
                        buy: buyPercentage, sell: sellPercentage,
                        amountBuy,
                        amountSell
                    },
                    wallsByAsks: orderBook.calc('wallsByAsks'),
                    wallsByBids: orderBook.calc('wallsByBids'),
                    time
                };
                yield OrderBook_1.default.create(lastMarketDepth);
            }
            catch (err) {
                console.log('Nesse exato segundo, o BOOK não tinha ofertas de ask/bid para essa moeda ' + symbol);
            }
        });
    }
    getLastBook(symbol) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let last = yield OrderBook_1.default.findOne({ symbol: symbol }).sort({ time: -1 });
            return last;
        });
    }
}
exports.OrderBookService = OrderBookService;
//# sourceMappingURL=OrderBookService.js.map