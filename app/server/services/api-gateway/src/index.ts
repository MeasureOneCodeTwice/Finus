/*
This service should have express, cors and http-proxy-middleware installed as dependencies.
It will act as an API Gateway, routing requests to the appropriate microservices. In the real world, the other 
 microservices would not be reachable from the outside internet, but for now this will do.

The /api/test endpoint will try to reach every other stood up service and return their status to client.

*/

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: 'http://localhost:8080',  // vite dev server so that the client can access this API
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
process.on("SIGTERM", () =>  server.close());


//test endpoint
 app.get('/health', async (req: express.Request, res: express.Response) => {
     const result: { [string]: string} = {};
     const services: string[] = Object.keys(process.env).filter((x) => /^.*_SERVICE_ADDR$/.test(x));
     console.log(services);

     for(const service of services) {
       console.log(process.env[service]);
       const serviceName = service.split('_')[0];
       result[serviceName] = await fetch(`${process.env[service]}/health`)
         .then((res) => res.text())
         .catch((err) => err.message);
     }
     res.json(result);
  });

// Api Gateway routes to account, transaction and profiles
app.use(
  "/api/accounts",
  createProxyMiddleware({
    target: process.env.DATABASE_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/accounts": "/accounts" }
  })
);

app.use(
  "/api/transactions",
  createProxyMiddleware({
    target: process.env.DATABASE_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/transactions": "/transactions" }
  })
);

app.use(
  "/api/profiles",
  createProxyMiddleware({
    target: process.env.DATABASE_SERVICE_ADDR,
    changeOrigin: true,
    pathRewrite: { "^/api/profiles": "/profiles" }
  })
);
