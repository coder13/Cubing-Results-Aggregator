import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { parseActivityCode } from "@wca/helpers";
import { RoundType } from "@prisma/client";
import { getRoundTypeFromRoundNumber } from "../rounds";

/**
 * Import a competition and results from the wca website via the WCIF.
 */
export const importFromWcif = async (competitionId: string) => {
  const wcaApi = new WcaApi();

  const wcif = await wcaApi.getWcifByCompetitionId(competitionId);
  if (!wcif) {
    throw new Error(`No WCIF found for competition ${competitionId}`);
  }

  console.log(wcif.name);

  await prisma.$transaction(async () => {
    await prisma.competition.upsert({
      where: {
        wcaId: competitionId,
      },
      create: {
        wcaId: competitionId,
        name: wcif.name,
      },
      update: {
        name: wcif.name,
      },
    });

    await Promise.all(
      wcif.events.flatMap(({ id: eventId, rounds }) => {
        return rounds.map(async ({ id: roundId, ...round }) => {
          const roundNumber = getRoundNumberFromRoundId(roundId);

          if (!roundNumber) {
            throw new Error("WCIF Parse Error: roundId is missing roundNumber");
          }

          const roundType = getRoundTypeFromRoundNumber(
            rounds.length,
            roundNumber,
          );

          await prisma.round.upsert({
            where: {
              competitionId_eventId_number: {
                competitionId,
                eventId,
                number: roundNumber!,
              },
            },
            create: {
              competitionId,
              eventId,
              number: roundNumber!,
              type: roundType,
            },
            update: {
              type: roundType,
            },
          });
        });
      }),
    );
  });
};

const getRoundNumberFromRoundId = (roundId: string) => {
  const { roundNumber } = parseActivityCode(roundId);
  if (!roundNumber) {
    throw new Error("WCIF Parse Error: roundId is missing roundNumber");
  }
  return roundNumber;
};
