import { PORT } from "@/port";
import { onExit } from "@/hooks";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { buildCorsConfig } from "@/expressUtils.ts";

const app = express();
app.use(buildCorsConfig());

const pathMatches = (path, valid): boolean => {
  path = path.replace("/api", "");
  return valid.includes(path);
};

const registerProxy = (target: string, paths: string[]): void => {
  app.use(
    createProxyMiddleware({
      pathFilter: (path) => pathMatches(path, paths),
      target: target,
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    }),
  );
};

registerProxy(process.env.AUTH_SERVICE_ADDR, ["/signup", "/login"]);

registerProxy(process.env.MARKET_SERVICE_ADDR, [
  "/markets/search",
  "/markets/quote",
  "/markets/history",
]);

registerProxy(process.env.USER_SERVICE_ADDR, [
  "/accounts",
  "/profiles",
  "/goals",
  "/debts",
  "/transactions",
  "/charts/expenses",
  "/table/transactions",
  "/table/transactions/accounts",
  "/table/snapshot",
  "/transactions/csvTransaction",
]);

registerProxy(process.env.ANALYTICS_SERVICE_ADDR, [
  "/charts/savings",
  "/charts/incomeflow",
  "/charts/budget-expenditure",
  "/compound-interest",
  "/predict-debt-payoff",
]);

app.get("/health", async (req: express.Request, res: express.Response) => {
  const services: string[] = Object.keys(process.env).filter((x) =>
    /^.*_SERVICE_ADDR$/.test(x),
  );

  //parallel arrays
  const serviceNames: string[] = services.map(
    (service) => service.split("_")[0],
  );
  const serviceStatusPromises: [Promise<string>] = services.map((service) =>
    fetch(`${process.env[service]}/health`)
      .then((res) => res.text())
      .catch((err) => err.message),
  );

  const serviceStatuses = await Promise.all(serviceStatusPromises);
  const results = {};
  services.forEach(
    (_, index) => (results[serviceNames[index]] = serviceStatuses[index]),
  );

  res.json(results);
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(async () => await server.close());
