import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index";
import { generateCsv } from "../utils/csv";

// Função para registrar as rotas relacionadas a links
export default async function routes(app: FastifyInstance) {
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
