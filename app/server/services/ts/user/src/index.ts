import express from 'express';
import { accountsRouter } from './routes/account';
import { profilesRouter } from './routes/profile';
import { transactionsRouter } from './routes/transaction';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.use((req,res,next)=>{
  console.log("USER Incoming request: " + req.method + " " + req.url)
  console.log(req.body)
  next()
})

//test endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
    res.send('ok');
});

app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/profiles", profilesRouter);

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
process.on("SIGTERM", () =>  server.close());
