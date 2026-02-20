import { PORT } from '@/port';
import { buildCorsConfig } from '@/corsUtil';
import { onExit } from '@/hooks';
import express from 'express';
// import { createProxyMiddleware } from 'http-proxy-middleware';


/*
This service should have express, cors and http-proxy-middleware installed as dependencies.
It will act as an API Gateway, routing requests to the appropriate microservices. In the real world, the other 
 microservices would not be reachable from the outside internet, but for now this will do.

The /api/test endpoint will try to reach every other stood up service and return their status to client.

*/

const app = express();
app.use(buildCorsConfig());
app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(() => server.close());


//API gateway sits on port 3000 and is accessible from there. Go to browser and type http://localhost:3000/health and you should see which services are up.
app.get('/health', async (req: express.Request, res: express.Response) => {
    const result: { [string]: string} = {};
    const services: string[] = Object.keys(process.env).filter((x) => /^.*_SERVICE_ADDR$/.test(x));

    for(const service of services) {
      const serviceName = service.split('_')[0];
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
