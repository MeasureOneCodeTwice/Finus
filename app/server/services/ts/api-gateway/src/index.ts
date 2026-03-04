import { PORT } from "@/port";
import { onExit } from "@/hooks";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import cors from 'cors';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost,http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req,res,next)=>{
  console.log("API-GATEWAY Incoming request: " + req.method + " " + req.url)
  console.log(req.body)
  next()
})

app.use(
  createProxyMiddleware({
    pathFilter: "/api/signup",
    target: process.env.AUTH_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/signup": "/signup" },
  }),
);

// Api Gateway routes to account, transaction and profiles
app.use(
  createProxyMiddleware({
    pathFilter: "/api/accounts",
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/accounts": "/accounts" },
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
  }),
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

//API gateway sits on port 3000 and is accessible from there. Go to browser and type http://localhost:3000/health and you should see which services are up.
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

app.get(
  "/charts/expenses",
  async (req: express.Request, res: express.Response) => {
    console.log(
      "Received request for expenses chart data with query:",
      req.query,
    );
    const period = req.query.period as string;
    const response = await fetch(
      `${process.env.USER_SERVICE_ADDR}/charts/expenses?period=${period}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error fetching expenses chart data:", err);
        res.status(500).json({ error: "Failed to fetch expenses chart data" });
      });
    res.json(response);
  },
);

app.get(
  "/charts/savings",
  async (req: express.Request, res: express.Response) => {
    console.log(
      "Received request for savings chart data with query:",
      req.query,
    );
    const period = req.query.period as string;
    const response = await fetch(
      `${process.env.ANALYTICS_SERVICE_ADDR}/charts/savings?period=${period}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error fetching savings chart data:", err);
        res.status(500).json({ error: "Failed to fetch savings chart data" });
      });
    res.json(response);
  },
);

app.get(
  "/charts/incomeflow",
  async (req: express.Request, res: express.Response) => {
    console.log(
      "Received request for income chart data with query:",
      req.query,
    );
    const period = req.query.period as string;
    const response = await fetch(
      `${process.env.ANALYTICS_SERVICE_ADDR}/charts/incomeflow?period=${period}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error fetching income chart data:", err);
        res.status(500).json({ error: "Failed to fetch income chart data" });
      });
    res.json(response);
  },
);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/tranasctions",
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/transactions": "/transactions" }
  })
);

app.use(
  createProxyMiddleware({
    pathFilter:"/api/profiles",
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/profiles": "/profiles" }
  })
);

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(async () => await server.close());

//process.on("SIGTERM", () =>  server.close());
