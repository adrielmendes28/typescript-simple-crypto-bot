"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PriceSchema = new mongoose_1.Schema({
    symbol: { type: String, required: false },
    price: { type: Number, required: false },
    time: { type: Date, required: false }
});
PriceSchema.set('timestamps', true);
exports.default = mongoose_1.model("Price", PriceSchema);
//# sourceMappingURL=Price.js.map