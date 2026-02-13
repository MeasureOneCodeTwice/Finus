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


//test endpoint
 app.get('/health', async (req: express.Request, res: express.Response) => {
     const result: { [string]: string} = {};
     const services: string[] = Object.keys(process.env).filter((x) => /^.*_SERVICE_ADDR$/.test(x));

     for(const service of services) {
       const serviceName = service.split('_')[0];
       result[serviceName] = await fetch(`${process.env[service]}/health`)
         .then((res) => res.text())
         .catch((err) => err.message);
     }
     res.json(result);
  });
