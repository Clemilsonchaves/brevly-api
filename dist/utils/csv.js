"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsv = generateCsv;
const csv_writer_1 = require("csv-writer");
function generateCsv(data) {
    const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
        header: [
            { id: "originalUrl", title: "URL Original" },
            { id: "shortUrl", title: "URL Encurtada" },
            { id: "accessCount", title: "Acessos" },
            { id: "createdAt", title: "Data de Criação" },
        ],
    });
    return (csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data));
}
