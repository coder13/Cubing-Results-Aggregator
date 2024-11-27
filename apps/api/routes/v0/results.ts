import { Router } from "express";
import { ResultsControllers } from "@/controllers/index";

const router = Router();

router.get("/", ResultsControllers.get_results);

export default router;
