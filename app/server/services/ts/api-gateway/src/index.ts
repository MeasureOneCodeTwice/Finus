import { PORT } from "@/port";
import { onExit } from "@/hooks";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { buildCorsConfig } from "@/expressUtils";

const app = express();
app.use(buildCorsConfig());

const pathMatches = (path, valid) => {
  path = path.replace("/api/", "");
  return valid.includes(path);
};

const AUTH_PATHS = ["signup", "login"];
app.use(
  createProxyMiddleware({
    pathFilter: (path) => pathMatches(path, AUTH_PATHS),
    target: process.env.AUTH_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  }),
);

const USER_PATHS = ["accounts", "profile", "tranasctions", "charts/expenses"];
app.use(
  createProxyMiddleware({
    pathFilter: (path) => pathMatches(path, USER_PATHS),
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  }),
);

const ANALYTICS_PATHS = ["charts/savings", "charts/incomeflow"];
app.use(
  createProxyMiddleware({
    pathFilter: (path) => pathMatches(path, ANALYTICS_PATHS),
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  }),
);

app.get("/health", async (req: express.Request, res: express.Response) => {
  const result: { [key: string]: string } = {};
  const services: string[] = Object.keys(process.env).filter((x) =>
    /^.*_SERVICE_ADDR$/.test(x),
  );

  for (const service of services) {
    const serviceName = service.split("_")[0];
    result[serviceName] = await fetch(`${process.env[service]}/health`)
      .then((res) => res.text())
      .catch((err) => err.message);
    console.log("received response");
  }

  res.json(result);
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(async () => await server.close());
