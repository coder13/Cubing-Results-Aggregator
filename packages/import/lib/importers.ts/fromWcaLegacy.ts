import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { ApiResult } from "@datasources/wca/types";
import { getRoundTypeFromId } from "../rounds";
import {
  Competition,
  Prisma,
  RegistrationStatus,
  ResultSource,
} from "@prisma/client";
import { upsertCompetition } from "../helpers";

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
        subId: 1,
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

    const _rounds = results.reduce(
      (acc, result) => {
        if (!acc[result.event_id]) {
          acc[result.event_id] = new Map<string, string>();
        }

        acc[result.event_id].set(result.round_type_id, result.format_id);
        return acc;
      },
      {} as Record<string, Map<string, string>>,
    );

    for (const [eventId, rounds] of Object.entries(_rounds)) {
      const sortedRounds = [...rounds.entries()]
        .map(([roundTypeId, formatId]) => ({
          roundTypeId,
          formatId,
        }))
        .sort((a, b) => {
          const aRound = getRoundTypeFromId(a.roundTypeId);
          const bRound = getRoundTypeFromId(b.roundTypeId);

          if (!aRound) {
            throw new Error(`Round not found ${a.roundTypeId}`);
          } else if (!bRound) {
            throw new Error(`Round not found ${b.roundTypeId}`);
          }

          return bRound.rank - aRound.rank;
        });

      console.log("Rounds", sortedRounds);

      for (let i = 0; i < sortedRounds.length; i++) {
        const round = sortedRounds[i];
        const roundNumber = i + 1;

        console.log({
          eventId,
          roundNumber,
          type: getRoundTypeFromId(round.roundTypeId)!.type,
        });

        await prisma.round.upsert({
          where: {
            competitionId_eventId_number: {
              competitionId,
              eventId,
              number: roundNumber,
            },
          },
          create: {
            competitionId,
            eventId,
            number: roundNumber,
            type: getRoundTypeFromId(round.roundTypeId)!.type,
            formatId: round.formatId,
          },
          update: {
            type: getRoundTypeFromId(round.roundTypeId)!.type,
            formatId: round.formatId,
          },
        });
      }
    }

    const allRounds = await prisma.round.findMany({
      where: {
        competitionId,
      },
    });

    await prisma.result.createMany({
      data: results.map((result) => {
        const person = allPersons.find((p) => p.wcaId === result.wca_id);
        if (!person) {
          throw new Error(`Person not found ${result.wca_id}`);
        }

        const round = allRounds.find(
          (r) =>
            r.eventId === result.event_id &&
            r.type === getRoundTypeFromId(result.round_type_id)!.type,
        );

        const data: Prisma.ResultCreateManyInput = {
          competitionId,
          eventId: result.event_id,
          roundNumber: round!.number,
          personId: person.id,
          best: result.best,
          average: result.average,
          attempts: result.attempts,
          source: ResultSource.WCA_OFFICIAL,
        };

        console.log(127, data);

        return data;
      }),
      skipDuplicates: true,
    });
  });
};
