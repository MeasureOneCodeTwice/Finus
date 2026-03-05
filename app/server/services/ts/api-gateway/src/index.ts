import { PORT } from "@/port.ts";
import { buildCorsConfig } from "@/corsUtil.ts";
import { onExit } from "@/hooks.ts";
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { create } from "node:domain";

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

//expenses bar chart in user service
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/expenses"],
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
  })
);

//transactions table in user service
app.use(
  createProxyMiddleware({
    pathFilter: ["/table/trasactions"],
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
  })
)

//snapshot of total values like debt, savings, etc from user service
app.use(
  createProxyMiddleware({
    pathFilter: ["/table/snapshot"],
    target: process.env.USER_SERVICE_ADDR,
    changeOrigin: true,
  })
);

//savings chart from analytics service
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/savings"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  })
);

//income flow chart from analytics service - this is the sankey chart
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/incomeflow"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  })
);

//budget-expenditure chart from analytics service
app.use(
  createProxyMiddleware({
    pathFilter: ["/charts/budget-expenditure"],
    target: process.env.ANALYTICS_SERVICE_ADDR,
    changeOrigin: true,
  })
);