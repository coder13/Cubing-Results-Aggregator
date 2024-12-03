import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { parseActivityCode } from "@wca/helpers";
import { Prisma, ResultSource } from "@prisma/client";
import {
  upsertCompetition,
  upsertPeopleAndRegistrationsFromWcif,
  upsertRoundsFromWcif,
} from "../helpers";

/**
 * Import a competition and results from the wca website via the WCIF.
 */
export const importFromWcif = async (_competitionId: string) => {
  const wcaApi = new WcaApi();

  // await new Promise((resolve) => setTimeout(resolve, 10000));

  const wcif = await wcaApi.getWcifByCompetitionId(_competitionId);
  if (!wcif) {
    throw new Error(`No WCIF found for competition ${_competitionId}`);
  }

  const competitionId = wcif.id;

  console.log("Importing results from wcif", wcif.name);

  await prisma.$transaction(async () => {
    upsertCompetition(wcif);

    // Includes people already in and new people with all statuses updated
    const { allAcceptedPeople, getPersonIdFromWcaUserId } =
      await upsertPeopleAndRegistrationsFromWcif(wcif);

    await upsertRoundsFromWcif(wcif);

    const newResults = await prisma.result.createManyAndReturn({
      select: {
        eventId: true,
        roundNumber: true,
        personId: true,
      },
      data: wcif.events.flatMap(({ id: eventId, rounds }) =>
        rounds.flatMap(({ id: roundId, ...round }) =>
          round.results.map((result) => {
            const wcifPerson = wcif.persons.find(
              (p) => p.registrantId === result.personId,
            );

            if (!wcifPerson) {
              throw new Error(`Person not found ${result.personId}`);
            }

            const { roundNumber } = parseActivityCode(roundId) as {
              roundNumber: number;
            };

            const data: Prisma.ResultCreateManyInput = {
              competitionId,
              eventId,
              roundNumber,
              personId: getPersonIdFromWcaUserId(wcifPerson.wcaUserId),
              source: ResultSource.WCA_WCIF,
              best: result.best,
              attempts: result.attempts.map((i) => i.result),
              pos: result.ranking,
              average: result.average,
            };

            return data;
          }),
        ),
      ),
      skipDuplicates: true,
    });

    // update results already in db
    await Promise.all(
      wcif.events.flatMap(({ id: eventId, ...event }) =>
        event.rounds.flatMap(({ id: roundId, ...round }) =>
          round.results.flatMap((result) => {
            const { roundNumber } = parseActivityCode(roundId) as {
              roundNumber: number;
            };

            const registrantId = result.personId;
            const wcifPerson = wcif.persons.find(
              (p) => p.registrantId === registrantId,
            );

            if (!wcifPerson) {
              throw new Error(`Person not found ${registrantId}`);
            }

            const personId = getPersonIdFromWcaUserId(wcifPerson.wcaUserId);
            if (
              newResults.some(
                (r) =>
                  r.personId === registrantId &&
                  r.eventId === eventId &&
                  r.roundNumber === roundNumber,
              )
            ) {
              return;
            }

            if (
              !allAcceptedPeople.some((p) =>
                p.Registrations.some((r) => r.registrantId === registrantId),
              )
            ) {
              console.log(
                261,
                wcifPerson.name,
                "not registered for",
                competitionId,
              );
            }

            return prisma.result.update({
              where: {
                personIdCER: {
                  competitionId,
                  eventId,
                  roundNumber,
                  personId,
                },
              },
              data: {
                best: result.best,
                attempts: result.attempts.map((a) => a.result),
                average: result.average,
                source: ResultSource.WCA_WCIF,
              },
            });
          }),
        ),
      ),
    );
  });
};
