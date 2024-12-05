import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import {
  upsertCompetition,
  upsertPeopleAndRegistrationsFromWcif,
  upsertRoundsFromWcif,
} from "../helpers";
import { WcaLiveApi } from "@datasources/wca-live";
import { Prisma, ResultSource } from "@prisma/client";

export const importFromWcaLive = async (_competitionId: string) => {
  const wcaApi = new WcaApi();
  const wcaLiveApi = new WcaLiveApi();

  const comp = await wcaApi.getCompetitionById(_competitionId);

  const wcif = await wcaApi.getWcifByCompetitionId(_competitionId);
  if (!wcif) {
    throw new Error(`No WCIF found for competition ${_competitionId}`);
  }

  const liveResults = await wcaLiveApi.getResultsByCompetitionId(wcif.id);

  if (!liveResults) {
    throw new Error(`No live results found for competition ${_competitionId}`);
  }

  const competitionId = wcif.id;

  console.log("Importing results from wca live", wcif.name);

  await prisma.$transaction(async () => {
    await upsertCompetition(comp);

    const { getPersonIdFromWcaUserId } =
      await upsertPeopleAndRegistrationsFromWcif(wcif);

    await upsertRoundsFromWcif(wcif);

    const newResults = await prisma.result.createManyAndReturn({
      select: {
        eventId: true,
        roundNumber: true,
        personId: true,
      },
      data: liveResults.events.flatMap(({ eventId, rounds }) =>
        rounds.flatMap(({ number: roundNumber, results }) =>
          results.map((result) => {
            const wcifPerson = wcif.persons.find(
              (p) => p.registrantId === result.personId,
            );

            if (!wcifPerson) {
              throw new Error(`Person not found ${result.personId}`);
            }

            const personId = getPersonIdFromWcaUserId(wcifPerson.wcaUserId);

            if (!personId) {
              throw new Error(`Person not found ${wcifPerson.registrantId}`);
            }

            const data: Prisma.ResultCreateManyInput = {
              competitionId,
              eventId,
              roundNumber,
              personId: getPersonIdFromWcaUserId(wcifPerson.wcaUserId),
              source: ResultSource.WCA_LIVE,
              best: result.best,
              attempts: result.attempts,
              pos: result.ranking,
              average: result.average,
            };

            return data;
          }),
        ),
      ),
      skipDuplicates: true,
    });

    console.log(`Created ${newResults.length} new results`);

    let changed = 0;
    await Promise.all(
      liveResults.events.flatMap(({ eventId, rounds }) =>
        rounds.flatMap(({ number: roundNumber, results }) =>
          results.map((result) => {
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
                  r.personId === personId &&
                  r.eventId === eventId &&
                  r.roundNumber === roundNumber,
              )
            ) {
              return;
            }

            changed++;

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
                attempts: result.attempts,
                average: result.average,
                pos: result.ranking,
                source: ResultSource.WCA_LIVE,
              },
            });
          }),
        ),
      ),
    );

    console.log(`Updated ${changed} results`);
  });
};
