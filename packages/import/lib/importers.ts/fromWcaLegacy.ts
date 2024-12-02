import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { ApiResult } from "@datasources/wca/types";
import { getRoundTypeFromId } from "../rounds";
import { Competition } from "@prisma/client";

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

  await prisma.$transaction(async () => {
    const comp = await prisma.competition.upsert({
      where: {
        wcaId: competitionId,
      },
      create: {
        wcaId: competitionId,
        name: competition.name,
      },
      update: {
        name: competition.name,
      },
    });

    const groupedResults = results.reduce(
      (acc: Record<string, Record<string, ApiResult[]>>, result) => {
        if (!acc[result.event_id]) {
          acc[result.event_id] = {};
        }

        if (!acc[result.event_id][result.round_type_id]) {
          acc[result.event_id][result.round_type_id] = [];
        }

        acc[result.event_id][result.round_type_id].push(result);

        return acc;
      },
      {},
    );

    Object.entries(groupedResults).forEach(async ([eventId, rounds]) => {
      const roundTypes = Object.keys(rounds).sort((a, b) => {
        const roundA = getRoundTypeFromId(a);
        const roundB = getRoundTypeFromId(b);
        if (!roundA || !roundB) {
          return 0;
        }

        return roundA.rank - roundB.rank;
      });

      await Promise.all(
        Object.entries(rounds).map(async ([roundTypeId, results]) => {
          const roundNumber = roundTypes.indexOf(roundTypeId) + 1;
          insertRound({
            competition: comp,
            eventId,
            roundTypeId,
            roundNumber,
            results,
          });
        }),
      );
    });
  });
};

const insertRound = async ({
  competition,
  eventId,
  roundNumber,
  roundTypeId,
  results,
}: {
  competition: Competition;
  eventId: string;
  roundTypeId: string;
  roundNumber: number;
  results: ApiResult[];
}) => {
  const competitionId = competition.wcaId;
  const roundType = getRoundTypeFromId(roundTypeId)!;

  const round = await prisma.round.upsert({
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
      type: roundType.type,
    },
    update: {
      type: roundType.type,
      Results: {},
    },
  });
};
