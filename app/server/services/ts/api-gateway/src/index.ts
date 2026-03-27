import { PORT } from "@/port";
import { onExit } from "@/hooks";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { buildCorsConfig } from "@/expressUtils.ts";

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

const USER_PATHS = [
  "accounts",
  "profiles",
  "/charts/expenses",
  "/table/transactions",
  "/table/snapshot",
  "/goals",
];
app.use(
  createProxyMiddleware({
    pathFilter: (path) => pathMatches(path, USER_PATHS),
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/transactions",
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/transactions": "/transactions" },
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

//expenses bar chart in user service
// app.use(
//   createProxyMiddleware({
//     pathFilter: ["/charts/expenses"],
//     target: process.env.USER_SERVICE_ADDR,
//     changeOrigin: true,
//   }),
// );

//transactions table in user service
// app.use(
//   createProxyMiddleware({
//     pathFilter: ["/table/transactions"],
//     target: process.env.USER_SERVICE_ADDR,
//     changeOrigin: true,
//   }),
// );

//snapshot of total values like debt, savings, etc from user service
// app.use(
//   createProxyMiddleware({
//     pathFilter: ["/table/snapshot"],
//     target: process.env.USER_SERVICE_ADDR,
//     changeOrigin: true,
//   }),
// );

//savings chart from analytics service
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/savings"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  }),
);

//income flow chart from analytics service - this is the sankey chart
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/incomeflow"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  }),
);

//budget-expenditure chart from analytics service
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/budget-expenditure"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  }),
);
