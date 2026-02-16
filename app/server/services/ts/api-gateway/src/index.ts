import { PORT } from "@/port";
import { buildCorsConfig } from "@/corsUtil";
import { onExit } from "@/hooks";
import express from "express";

const AUTH_SERVICE_ADDR = process.env.AUTH_SERVICE_ADDR || "http://localhost:8000";

const app = express();
app.use(buildCorsConfig(undefined));
app.use(express.json());

async function forwardAuthRequest(req: express.Request, res: express.Response, path: string) {
  try {
    const authResponse = await fetch(`${AUTH_SERVICE_ADDR}${path}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const responseText = await authResponse.text();
    const responseType = authResponse.headers.get("content-type") || "";
    res.status(authResponse.status);

    if (responseType.includes("application/json")) {
      res.type("application/json");
      try {
        res.send(JSON.parse(responseText));
        return;
      } catch {
        res.send(responseText);
        return;
      }
    }

    res.send(responseText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach auth service.";
    res.status(502).json({ ok: false, error: message });
  }
}

app.post("/api/auth/signup", async (req: express.Request, res: express.Response) => {
  await forwardAuthRequest(req, res, "/api/auth/signup");
});

app.post("/api/auth/login", async (req: express.Request, res: express.Response) => {
  await forwardAuthRequest(req, res, "/api/auth/login");
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
onExit(() => server.close());

app.get("/health", async (_req: express.Request, res: express.Response) => {
  const result: { [service: string]: string } = {};
  const services: string[] = Object.keys(process.env).filter((x) =>
    /^.*_SERVICE_ADDR$/.test(x),
  );

  for (const service of services) {
    const serviceAddress = process.env[service];
    if (!serviceAddress) {
      continue;
    }

    const [serviceName = service] = service.split("_");
    result[serviceName] = await fetch(`${serviceAddress}/health`)
      .then((serviceRes) => serviceRes.text())
      .catch((err) => err.message);
  }
  res.json(result);
});
