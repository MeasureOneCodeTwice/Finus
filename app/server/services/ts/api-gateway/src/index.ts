import type { PORT } from "@/port";
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


//API gateway sits on port 3000 and is accessible from there. Go to browser and type http://localhost:3000/health and you should see which services are up.
app.get('/health', async (req: express.Request, res: express.Response) => {
    const result: { [serviceName: string]: string } = {};
    const services: string[] = Object.keys(process.env).filter((x) => /^.*_SERVICE_ADDR$/.test(x));

    for(const service of services) {
      const serviceName = service.split('_')[0];
      if (serviceName)
        result[serviceName] = await fetch(`${process.env[service]}/health`)
          .then((res) => res.text())
          .catch((err) => err.message);
        console.log("received response");
    }
    
    res.json(result);
});

app.get('/charts/expenses', async (req: express.Request, res: express.Response) => {
  console.log("Received request for expenses chart data with query:", req.query);
  const period = req.query.period as string;
  const response = await fetch(`${process.env.USER_SERVICE_ADDR}/charts/expenses?period=${period}`)
      .then((res) => res.json())
      .catch((err) => {
          console.error("Error fetching expenses chart data:", err);
          res.status(500).json({ error: "Failed to fetch expenses chart data" });
      });
  res.json(response);
});



app.get('/charts/savings', async (req: express.Request, res: express.Response) => {
  console.log("Received request for savings chart data with query:", req.query);
  const period = req.query.period as string;
  const response = await fetch(`${process.env.ANALYTICS_SERVICE_ADDR}/charts/savings?period=${period}`)
      .then((res) => res.json())
      .catch((err) => {
          console.error("Error fetching savings chart data:", err);
          res.status(500).json({ error: "Failed to fetch savings chart data" });
      });
  res.json(response);
});




app.get('/charts/incomeflow', async (req: express.Request, res: express.Response) => {
  console.log("Received request for income chart data with query:", req.query);
  const period = req.query.period as string;
  const response = await fetch(`${process.env.ANALYTICS_SERVICE_ADDR}/charts/incomeflow?period=${period}`)
      .then((res) => res.json())
      .catch((err) => {
          console.error("Error fetching income chart data:", err);
          res.status(500).json({ error: "Failed to fetch income chart data" });
      });
  res.json(response);
});
