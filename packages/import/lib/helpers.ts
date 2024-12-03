import { Competition } from "@wca/helpers";
import { prisma } from "./db";
import { RegistrationStatus } from "@prisma/client";
import {
  getRoundNumberFromRoundId,
  getRoundTypeFromRoundNumber,
} from "./rounds";
import { ApiCompetition } from "@datasources/wca/types";

export const upsertCompetition = (comp: ApiCompetition) => {
  const what = {
    name: comp.name,
    cityName: comp.city,
    countryId: comp.country_iso2,
    startDate: comp.start_date,
    endDate: comp.end_date,
    cancelled_at: comp.cancelled_at,
    eventIds: comp.event_ids,
  };

  return prisma.competition.upsert({
    where: {
      wcaId: comp.id,
    },
    create: {
      wcaId: comp.id,
      ...what,
    },
    update: what,
  });
};

export const upsertPeopleAndRegistrationsFromWcif = async ({
  id: competitionId,
  ...wcif
}: Competition) => {
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

  const getPersonIdFromWcaUserId = (wcaUserId: number) => {
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
          personId: getPersonIdFromWcaUserId(person.wcaUserId),
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

  return { allAcceptedPeople, getPersonIdFromWcaUserId };
};

export const upsertRoundsFromWcif = async ({
  id: competitionId,
  ...wcif
}: Competition) => {
  // update round types for existing rounds
  return await Promise.all(
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
            formatId: round.format,
          },
          update: {
            type: roundType,
          },
        });
      });
    }),
  );
};
