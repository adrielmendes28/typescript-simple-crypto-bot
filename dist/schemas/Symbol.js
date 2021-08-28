"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SymbolSchema = new mongoose_1.Schema({
    id: { type: String, required: false },
    symbol: { type: String, required: false }
});
SymbolSchema.set('timestamps', true);
exports.default = mongoose_1.model("Symbol", SymbolSchema);
//# sourceMappingURL=Symbol.js.map