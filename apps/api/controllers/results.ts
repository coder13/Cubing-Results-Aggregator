import { RequestHandler } from "express";
import { prismaClient } from "../db";
import { query } from "express-validator";
import { errorHandler } from "../middlewares/errorHandler";

export const get_results: RequestHandler[] = [
  query("competitionId").optional().isString(),
  query("personId").optional().isInt(),
  errorHandler,
  async (req, res) => {
    const params = req.query;

    const competitionId = params.competition_id;
    const personId = params.personId;

    prismaClient.result
      .findMany({
        where: {
          ...(competitionId && { competitionId: competitionId.toString() }),
          ...(personId && { personId: +personId }),
        },
      })
      .then((results) => {
        res.json(results);
      });
  },
];
