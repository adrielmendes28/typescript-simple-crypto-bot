"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderItemSchema = new mongoose_1.Schema({
    position: { type: Number, required: false },
    price: { type: Number, required: false },
    qty: { type: Number, required: false },
    total: { type: Number, required: false },
    order: { type: String, required: false }
});
const wallItemSchema = new mongoose_1.Schema({
    price: { type: Number, required: false },
    amount: { type: Number, required: false },
    total: { type: Number, required: false }
});
const OrderBookSchema = new mongoose_1.Schema({
    id: { type: String, required: false },
    symbol: { type: String, required: false },
    bids: [orderItemSchema],
    asks: [orderItemSchema],
    spread: { type: Number, required: false },
    depthByPercent: {
        up: { type: Number, required: false }, down: { type: Number, required: false },
    },
    median: {
        buy: { type: Number, required: false }, sell: { type: Number, required: false },
    },
    interest: {
        buy: { type: Number, required: false }, sell: { type: Number, required: false },
        amountBuy: { type: Number, required: false },
        amountSell: { type: Number, required: false }
    },
    wallsByAsks: [wallItemSchema],
    wallsByBids: [wallItemSchema],
    time: { type: Date, required: false }
});
OrderBookSchema.set('timestamps', true);
exports.default = mongoose_1.model("OrderBook", OrderBookSchema);
//# sourceMappingURL=OrderBook.js.map