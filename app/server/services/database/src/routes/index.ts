//Index file for database service, sets up express server and routes

import express from "express";
import { accountsRouter } from "./account";
import { transactionsRouter } from "./transaction";
import { profilesRouter } from "./profile";

const app = express();
app.use(express.json());

app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/profiles", profilesRouter);