"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const dotenv_1 = require("dotenv");
const links_1 = __importDefault(require("./routes/links"));
(0, dotenv_1.config)();
const app = (0, fastify_1.default)();
app.register(cors_1.default);
app.register(links_1.default);
app.get("/", async () => {
    return { status: "ok" };
});
app.listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" })
    .then(address => {
    console.log('http: Running server🚀');
    console.log(`Server listening at ${address}`);
})
    .catch(err => {
    app.log.error(err);
    process.exit(1);
});
