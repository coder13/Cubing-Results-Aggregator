import { WcaApi } from "@datasources/wca";
import { prisma } from "../db";
import { parseActivityCode } from "@wca/helpers";
import {
  Prisma,
  RegistrationStatus,
  ResultSource,
  RoundType,
} from "@prisma/client";
import { getRoundTypeFromRoundNumber } from "../rounds";

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

    const competingRegistrantIds = wcif.persons
      .filter((i) => !!i.registrantId)
      .map((i) => i.registrantId);

    // Create new people
    await prisma.person.createMany({
      data: wcif.persons
        .filter(
          ({ registration }) =>
            registration && registration.status === "accepted",
        )
        .map((person) => {
          return {
            wcaUserId: person.wcaUserId,
            wcaId: person.wcaId,
            subId: 1,
            name: person.name,
            countryId: person.countryIso2,
          };
        }),
      skipDuplicates: true,
    });

    // by this point, all persons are in the db and we just need their db IDs
    const persons = await prisma.person.findMany({
      where: {
        wcaUserId: {
          in: wcif.persons.map((i) => i.wcaUserId),
        },
      },
    });

    const getPersonId = (wcaUserId: number) => {
      const person = persons.find((p) => p.wcaUserId === wcaUserId);
      if (!person) {
        throw new Error(`Person not found ${wcaUserId}`);
      }
      return person.id;
    };

    await prisma.registration.createMany({
      data: wcif.persons
        .filter(
          ({ registration }) =>
            registration && registration.status === "accepted",
        )
        .map((person) => {
          return {
            personId: getPersonId(person.wcaUserId),
            competitionId,
            registrantId: person.registrantId,
            status: RegistrationStatus.ACCEPTED,
          };
        }),
      skipDuplicates: true,
    });

    // Update registrations that might have been deleted to be deleted
    await prisma.registration.updateMany({
      where: {
        competitionId,
        registrantId: {
          notIn: competingRegistrantIds,
        },
      },
      data: {
        status: RegistrationStatus.DELETED,
      },
    });

    // consider all other registrations accepted (in case someone went from accepted -> deleted -> accepted)
    await prisma.registration.updateMany({
      where: {
        competitionId,
        registrantId: {
          in: competingRegistrantIds,
        },
      },
      data: {
        status: RegistrationStatus.ACCEPTED,
      },
    });

    // Includes people already in and new people with all statuses updated
    const allAcceptedPeople = await prisma.person.findMany({
      include: {
        Registrations: {
          where: {
            competitionId,
          },
          take: 1,
        },
      },
      where: {
        Registrations: {
          some: {
            competitionId,
            status: RegistrationStatus.ACCEPTED,
          },
        },
      },
    });

    console.log(146, allAcceptedPeople);

    // update round types for existing rounds
    await Promise.all(
      wcif.events.flatMap(({ id: eventId, rounds }) => {
        return rounds.map(async ({ id: roundId }) => {
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
              personId: getPersonId(wcifPerson.wcaUserId),
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

            const personId = getPersonId(wcifPerson.wcaUserId);

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

const getRoundNumberFromRoundId = (roundId: string) => {
  const { roundNumber } = parseActivityCode(roundId);
  if (!roundNumber) {
    throw new Error("WCIF Parse Error: roundId is missing roundNumber");
  }
  return roundNumber;
};
