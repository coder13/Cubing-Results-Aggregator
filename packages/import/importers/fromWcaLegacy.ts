import { prisma } from "../lib/db";
import {
  bulkCreateOfficalResults,
  upsertCompetition,
  upsertRoundsFromResults,
} from "../lib/helpers";
import { wcaApi } from "../lib/wcaApi";

/**
 * Import a competition and results from the wca website
 * This uses the /results api for fetching results.
 * This is necessary for comps that were not in the WCIF format.
 */
export const importFromWcaLegacy = async (_competitionId: string) => {
  const competition = await wcaApi.getCompetitionById(_competitionId);
  const competitionId = competition.id;

  const results = await wcaApi.getResultsByCompetitionId(competitionId);
  const competitors = await wcaApi.getCompetitorsByCompetitionId(competitionId);

  await prisma.$transaction(async () => {
    await upsertCompetition(competition);

    await prisma.person.createMany({
      data: competitors.map(
        ({ id: wcaId, name, country_iso2: countryIso2 }) => ({
          wcaId,
          name,
          countryIso2,
        }),
      ),
      skipDuplicates: true,
    });

    const allPersons = await prisma.person.findMany({
      where: {
        wcaId: {
          in: competitors.map((c) => c.id),
        },
      },
    });

    await upsertRoundsFromResults(competitionId, results);

    const allRounds = await prisma.round.findMany({
      where: {
        competitionId,
      },
    });

    await bulkCreateOfficalResults(
      competition,
      competitionId,
      allPersons,
      allRounds,
      results,
    );
  });

  return competition;
};
