"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OrderBookSchema = new mongoose_1.Schema({
    id: { type: String, required: false },
});
exports.default = mongoose_1.model("OrderBook", OrderBookSchema);
//# sourceMappingURL=Symbol.js.map