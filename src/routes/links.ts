import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index";
import { links } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { generateCsv } from "../utils/csv";
import { generateRandomFileName } from "../utils/file";

export default async function routes(app: FastifyInstance) {
  // Criar link
  app.post("/links", async (req: FastifyRequest, reply: FastifyReply) => {
    const { customAlphabet } = await import("nanoid");
    type Body = { originalUrl: string; shortUrl?: string };
    const { originalUrl } = req.body as Body;
    let { shortUrl } = req.body as Body;
    try {
      new URL(originalUrl);
    } catch {
      return reply.status(400).send({ error: "URL original inválida" });
    }
    if (!shortUrl) {
      const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
      shortUrl = nanoid();
    }
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(shortUrl)) {
      return reply.status(400).send({ error: "URL encurtada mal formatada" });
    }
    try {
      const exists = (
        await db.select().from(links).where(eq(links.shortUrl, shortUrl))
      )[0];
      if (exists) {
        return reply.status(409).send({ error: "URL encurtada já existe" });
      }
      const [created] = await db
        .insert(links)
        .values({ originalUrl, shortUrl })
        .returning();
      return reply.status(201).send({
        ...created,
        shortCode: created.shortUrl,
      });
    } catch (err) {
      return reply
        .status(500)
        .send({ error: "Erro interno ao criar link", details: String(err) });
    }
  });

  // Deletar link por shortUrl
  app.delete(
    "/links/:shortUrl",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { shortUrl } = req.params as { shortUrl: string };
      const deleted = await db
        .delete(links)
        .where(eq(links.shortUrl, shortUrl))
        .returning();
      if (!deleted.length) {
        return reply.status(404).send({ error: "Link não encontrado" });
      }
      return reply.send({
        message: "Link deletado com sucesso!!!",
        link: deleted[0],
      });
    },
  );

  // Obter URL original por shortUrl
  app.get(
    "/links/:shortUrl",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { shortUrl } = req.params as { shortUrl: string };
      const link = (
        await db.select().from(links).where(eq(links.shortUrl, shortUrl))
      )[0];
      if (!link) {
        return reply.status(404).send({ error: "Link não encontrado" });
      }
      return reply.send({ originalUrl: link.originalUrl, link });
    },
  );

  // Listar links (paginado)
  app.get("/links", async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = "1", limit = "20" } = req.query as {
      page?: string;
      limit?: string;
    };
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const [{ count }] = await db
      .select({ count: sql`count(*)::int` })
      .from(links);
    const linksList = await db
      .select()
      .from(links)
      .orderBy(desc(links.createdAt))
      .limit(limitNum)
      .offset(offset);
    const mappedLinks = linksList.map((link) => ({
      ...link,
      shortCode: link.shortUrl,
    }));
    return reply.send({
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
      data: mappedLinks,
    });
  });

  // Exportar CSV diretamente para download
  app.get("/links/export", async (req: FastifyRequest, reply: FastifyReply) => {
    const linksList = await db.query.links.findMany({});
    const csv = generateCsv(
      linksList.map((l) => ({
        originalUrl: l.originalUrl,
        shortUrl: l.shortUrl,
        accessCount: l.accessCount,
        createdAt: l.createdAt?.toISOString() ?? "",
      })),
    );
    reply.header("Content-Type", "text/csv");
    reply.header(
      "Content-Disposition",
      `attachment; filename=links-${Date.now()}.csv`,
    );
    return reply.send(csv);
  });
}
