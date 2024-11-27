import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("tiny"));

app.get("/ping", (_, res) => {
  res.send("pong");
});

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
