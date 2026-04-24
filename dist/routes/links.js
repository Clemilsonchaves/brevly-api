"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = routes;
const index_1 = require("../db/index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const csv_1 = require("../utils/csv");
const r2_1 = require("../utils/r2");
const file_1 = require("../utils/file");
async function routes(app) {
    // Criar link
    app.post("/links", async (req, reply) => {
        // Importa nanoid dinamicamente dentro da função
        const { customAlphabet } = await import("nanoid");
        const { originalUrl } = req.body;
        let { shortUrl } = req.body;
        // Validação básica de URL original
        try {
            new URL(originalUrl);
        }
        catch {
            return reply.status(400).send({ error: "URL original inválida" });
        }
        // Gera shortUrl se não enviado
        if (!shortUrl) {
            const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
            shortUrl = nanoid();
        }
        // Validação da shortUrl (apenas letras, números, hífen, underline, 3-32 caracteres)
        if (!/^[a-zA-Z0-9_-]{3,32}$/.test(shortUrl)) {
            return reply.status(400).send({ error: "URL encurtada mal formatada" });
        }
        try {
            // Verifica duplicidade
            const exists = (await index_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.eq)(schema_1.links.shortUrl, shortUrl)))[0];
            if (exists) {
                return reply.status(409).send({ error: "URL encurtada já existe" });
            }
            // Cria o link
            const [created] = await index_1.db
                .insert(schema_1.links)
                .values({ originalUrl, shortUrl })
                .returning();
            return reply.status(201).send({ link: created });
        }
        catch (err) {
            // Log detalhado do erro
            console.error("Erro ao criar link:", err);
            if (err instanceof Error) {
                console.error("Stack:", err.stack);
            }
            return reply
                .status(500)
                .send({ error: "Erro interno ao criar link", details: String(err) });
        }
    });
    // Deletar link por shortUrl
    app.delete("/links/:shortUrl", async (req, reply) => {
        const { shortUrl } = req.params;
        const deleted = await index_1.db
            .delete(schema_1.links)
            .where((0, drizzle_orm_1.eq)(schema_1.links.shortUrl, shortUrl))
            .returning();
        if (!deleted.length) {
            return reply.status(404).send({ error: "Link não encontrado" });
        }
        return reply.send({
            message: "Link deletado com sucesso!!!",
            link: deleted[0],
        });
    });
    // Obter URL original por shortUrl
    app.get("/links/:shortUrl", async (req, reply) => {
        const { shortUrl } = req.params;
        const link = (await index_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.eq)(schema_1.links.shortUrl, shortUrl)))[0];
        if (!link) {
            return reply.status(404).send({ error: "Link não encontrado" });
        }
        return reply.send({ originalUrl: link.originalUrl, link });
    });
    // Listar links (paginado)
    app.get("/links", async (req, reply) => {
        const { page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        const [{ count }] = await index_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)::int` })
            .from(schema_1.links);
        const linksList = await index_1.db
            .select()
            .from(schema_1.links)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.links.createdAt))
            .limit(limitNum)
            .offset(offset);
        return reply.send({
            total: count ?? 0,
            page: pageNum,
            limit: limitNum,
            data: linksList,
        });
    });
    // Incrementar acessos por shortUrl
    app.post("/links/:shortUrl/access", async (req, reply) => {
        const { shortUrl } = req.params;
        // Incrementa accessCount de forma atômica
        const updated = await index_1.db
            .update(schema_1.links)
            .set({ accessCount: (0, drizzle_orm_1.sql) `${schema_1.links.accessCount} + 1` })
            .where((0, drizzle_orm_1.eq)(schema_1.links.shortUrl, shortUrl))
            .returning();
        if (!updated.length) {
            return reply.status(404).send({ error: "Link não encontrado" });
        }
        return reply.send({ message: "Acesso incrementado", link: updated[0] });
    });
    // Exportar CSV para CDN
    app.get("/links/export/csv", async (req, reply) => {
        const linksList = await index_1.db.query.links.findMany({});
        const csv = (0, csv_1.generateCsv)(linksList.map((l) => ({
            originalUrl: l.originalUrl,
            shortUrl: l.shortUrl,
            accessCount: l.accessCount,
            createdAt: l.createdAt?.toISOString() ?? "",
        })));
        const fileName = (0, file_1.generateRandomFileName)("csv");
        const url = await (0, r2_1.uploadToR2)(fileName, Buffer.from(csv, "utf-8"));
        return reply.send({ url });
    });
}
