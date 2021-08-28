"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TradeSchema = new mongoose_1.Schema({
    eventType: { type: String, required: false },
    symbol: { type: String, required: false },
    price: { type: Number, required: false },
    qty: { type: Number, required: false },
    total: { type: Number, required: false },
    maker: { type: Boolean, required: false },
    tradeId: { type: Number, required: false },
    time: { type: Date, required: false },
});
TradeSchema.set('timestamps', true);
exports.default = mongoose_1.model("Trade", TradeSchema);
//# sourceMappingURL=Trade.js.map