"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TradeSchema = new mongoose_1.Schema({
    id: { type: String, required: false },
});
exports.default = mongoose_1.model("Trade", TradeSchema);
//# sourceMappingURL=Trade.js.map