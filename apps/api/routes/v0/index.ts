import { Router } from "express";
import resultsRouter from "./results";

const router = Router();

router.use("/results", resultsRouter);

export default router;
