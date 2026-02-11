import { PORT } from '@/port';
import express from 'express';
const app = express();

app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
process.on("SIGTERM", () =>  server.close());

//test endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
    res.send('ok');
});
