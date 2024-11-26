import express from "express";
import { prismaClient } from "./db";

const app = express();

app.get("/", (_, res) => {
  res.send("Hello World!");
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
