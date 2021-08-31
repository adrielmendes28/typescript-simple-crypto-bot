"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OrderSchema = new mongoose_1.Schema({
    symbol: { type: String, required: false },
    orderId: { type: String, required: false },
    time: { type: Date, required: false },
    price: { type: String, required: false },
    earn: { type: String, required: false },
    quantity: { type: String, required: false },
    status: { type: String, required: false },
    order: { type: String, required: false },
    martinGale: { type: Number, required: false, default: 0 },
    martinSignal: { type: Number, required: false, default: 0 },
    sendStop: { type: String, required: false, default: false },
    sendProfit: { type: String, required: false, default: false },
});
OrderSchema.set('timestamps', true);
exports.default = mongoose_1.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map