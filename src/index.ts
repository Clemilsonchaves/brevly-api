import { config } from "dotenv";
config();
import Fastify from "fastify";
import cors from "@fastify/cors";
import routes from "./routes/links";
// Log das variáveis de ambiente para depuração
console.log("ENV PORT:", process.env.PORT);
console.log("ENV API_URL:", process.env.API_URL);
console.log("ENV DATABASE_URL:", process.env.DATABASE_URL);

const app = Fastify();

app.register(cors);
app.register(routes);

// Rota de health check
app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/", async () => {
  return { status: "ok" };
});

app
  .listen({ port: Number(process.env.PORT) || 3333, host: "0.0.0.0" })
  .then((address) => {
    console.log("http: Running server!!!🚀");
    console.log(`Server listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
