import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { links } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { generateCsv } from "../utils/csv.js";
import { uploadToR2 } from "../utils/r2.js";
import { generateRandomFileName } from "../utils/file.js";

export default async function routes(app: FastifyInstance) {
  // Criar link
  app.post("/links", async (req: FastifyRequest, reply: FastifyReply) => {
    // Importa nanoid dinamicamente dentro da função
    const { customAlphabet } = await import("nanoid");

    type Body = { originalUrl: string; shortUrl?: string };
    const { originalUrl } = req.body as Body;
    let { shortUrl } = req.body as Body;

    // Validação básica de URL original
    try {
      new URL(originalUrl);
    } catch {
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
      const exists = (
        await db.select().from(links).where(eq(links.shortUrl, shortUrl))
      )[0];
      if (exists) {
        return reply.status(409).send({ error: "URL encurtada já existe" });
      }

      // Cria o link
      const [created] = await db
        .insert(links)
        .values({ originalUrl, shortUrl })
        .returning();
      return reply.status(201).send({ link: created });
    } catch (err) {
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

    return reply.send({
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
      data: linksList,
    });
  });

  // Incrementar acessos por shortUrl
  app.post(
    "/links/:shortUrl/access",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { shortUrl } = req.params as { shortUrl: string };
      // Incrementa accessCount de forma atômica
      const updated = await db
        .update(links)
        .set({ accessCount: sql`${links.accessCount} + 1` })
        .where(eq(links.shortUrl, shortUrl))
        .returning();
      if (!updated.length) {
        return reply.status(404).send({ error: "Link não encontrado" });
      }
      return reply.send({ message: "Acesso incrementado", link: updated[0] });
    },
  );

  // Exportar CSV para CDN
  app.get(
    "/links/export/csv",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const linksList = await db.query.links.findMany({});
      const csv = generateCsv(
        linksList.map((l) => ({
          originalUrl: l.originalUrl,
          shortUrl: l.shortUrl,
          accessCount: l.accessCount,
          createdAt: l.createdAt?.toISOString() ?? "",
        })),
      );
      const fileName = generateRandomFileName("csv");
      const url = await uploadToR2(fileName, Buffer.from(csv, "utf-8"));
      return reply.send({ url });
    },
  );
}
