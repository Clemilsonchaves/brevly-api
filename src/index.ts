import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "dotenv";
import routes from "./routes/links";

config();

const app = Fastify();

app.register(cors);
app.register(routes);

app.get("/", async () => {
  return { status: "ok" };
});

app.listen(
  { port: Number(process.env.PORT) || 3000, host: "0.0.0.0" })
  .then(address => {
    console.log('http: Running server🚀');
    console.log(`Server listening at ${address}`);
  })
  .catch(err => {
    app.log.error(err);
    process.exit(1);
  });
