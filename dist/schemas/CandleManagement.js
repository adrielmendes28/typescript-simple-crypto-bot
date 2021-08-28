"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CandleStickSchema = new mongoose_1.Schema({
    symbol: { type: String, required: false },
    time: { type: Date, required: false },
    open: { type: Number, required: false },
    high: { type: Number, required: false },
    low: { type: Number, required: false },
    close: { type: Number, required: false },
    volume: { type: Number, required: false },
    isFinal: { type: Boolean, required: false },
});
const CandleManagemenSchema = new mongoose_1.Schema({
    symbol: { type: String, required: false },
    candles: [CandleStickSchema]
});
CandleManagemenSchema.set('timestamps', true);
exports.default = mongoose_1.model("CandleManagement", CandleManagemenSchema);
//# sourceMappingURL=CandleManagement.js.map