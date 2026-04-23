"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomFileName = generateRandomFileName;
const crypto_1 = require("crypto");
function generateRandomFileName(extension = "csv") {
    return `${(0, crypto_1.randomUUID)()}.${extension}`;
}
