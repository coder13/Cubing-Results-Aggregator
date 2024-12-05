import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { getRoundTypeFromId } from "../rounds";
import { Prisma, ResultSource } from "@prisma/client";
import {
  bulkCreateOfficalResults,
  upsertCompetition,
  upsertRoundsFromResults,
} from "../helpers";

/**
 * Import a competition and results from the wca website
 * This uses the /results api for fetching results.
 * This is necessary for comps that were not in the WCIF format.
 */
export const importFromWcaLegacy = async (_competitionId: string) => {
  const wcaApi = new WcaApi();

  const competition = await wcaApi.getCompetitionById(_competitionId);
  const competitionId = competition.id;

  const results = await wcaApi.getResultsByCompetitionId(competitionId);
  const competitors = await wcaApi.getCompetitorsByCompetitionId(competitionId);

  await prisma.$transaction(async () => {
    await upsertCompetition(competition);

    await prisma.person.createMany({
      data: competitors.map((competitor) => ({
        wcaId: competitor.id,
        name: competitor.name,
        countryId: competitor.country_iso2,
      })),
      skipDuplicates: true,
    });

    const allPersons = await prisma.person.findMany({
      where: {
        wcaId: {
          in: competitors.map((c) => c.id),
        },
      },
    });

    console.log(competitors.length, allPersons);

    await upsertRoundsFromResults(competitionId, results);

    const allRounds = await prisma.round.findMany({
      where: {
        competitionId,
      },
    });

    await bulkCreateOfficalResults(
      competitionId,
      allPersons,
      allRounds,
      results,
    );
  });
};
