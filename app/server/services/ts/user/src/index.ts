import { PORT } from '@/port';
import { onExit } from '@/hooks';
import { buildCorsConfig } from '@/corsUtil';
import express from 'express';

const app = express();
app.use(express.json());
app.use(buildCorsConfig());

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
onExit(() => server.close());

//test endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
    res.send('ok');
});
