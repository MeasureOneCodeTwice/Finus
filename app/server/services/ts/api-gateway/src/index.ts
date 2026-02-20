import { PORT } from "@/port";
import { buildCorsConfig } from "@/corsUtil";
import { onExit } from "@/hooks";
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(
  createProxyMiddleware({
    pathFilter: "/api/signup",
    target: process.env.AUTH_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/signup": "/signup" }
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/login",
    target: process.env.AUTH_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: {
      "^/api/login": "/login",
    },
  })
);

app.get("/health", async (_req: express.Request, res: express.Response) => {
  const result: { [service: string]: string } = {};
  const services: string[] = Object.keys(process.env).filter((x) =>
    /^.*_SERVICE_ADDR$/.test(x),
  );

  for (const service of services) {
    const serviceAddress = process.env[service];

    const [serviceName = service] = service.split("_");
    result[serviceName] = await fetch(`${serviceAddress}/health`)
      .then((serviceRes) => serviceRes.text())
      .catch((err) => err.message);
  }
  res.json(result);
});


app.use(buildCorsConfig(undefined));
app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(async () => await server.close());
