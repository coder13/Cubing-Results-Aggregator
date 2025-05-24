import { SimpleApiUser } from "@datasources/wca";
import { prisma } from "../lib/db";
import {
  bulkCreateOfficalResults,
  upsertCompetition,
  upsertRoundsFromResults,
} from "../lib/helpers";
import { Prisma, ResultSource } from "@prisma/client";
import { getRoundTypeFromId } from "../lib/rounds";
import { wcaApi } from "../lib/wcaApi";

/**
 * This importer is designed to follow up wca-live and make results official.
 * Results will have already been imported to an extent via the wcif however exact numbers would've come from wca-live
 * This merges wcif/wca-live/offical wca data
 */
export const importFromWca = async (_competitionId: string) => {
  // Fetch data in parallel
  const [comp, wcif, results] = await Promise.all([
    wcaApi.getCompetitionById(_competitionId),
    wcaApi.getWcifByCompetitionId(_competitionId),
    wcaApi.getResultsByCompetitionId(_competitionId),
  ]);

  if (!wcif) {
    throw new Error(`No WCIF found for competition ${_competitionId}`);
  }

  const persons = wcif.persons;
  const personIds = persons.map((p) => p.wcaUserId);
  const users = (await wcaApi.userLoader.loadMany(personIds)).filter(
    (value) => !(value instanceof Error),
  ) as SimpleApiUser[];

  const competitionId = wcif.id;

  await prisma.$transaction(async () => {
    await upsertCompetition(comp);

    upsertCompetitors(competitionId, users);

    const allPersons = await prisma.person.findMany({
      where: {
        wcaUserId: {
          in: personIds,
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
      comp,
      competitionId,
      allPersons,
      allRounds,
      results,
    );

    await Promise.all(
      results.map(async (result) => {
        const person = allPersons.find((p) => p.wcaId === result.wca_id);
        if (!person) {
          throw new Error(`Person not found ${result.wca_id}`);
        }

        const round = allRounds.find(
          (r) =>
            r.eventId === result.event_id &&
            r.type === getRoundTypeFromId(result.round_type_id)!.type,
        );

        const where = {
          competitionId,
          eventId: result.event_id,
          personId: person.id,
          roundNumber: round!.number,
        };

        const data: Prisma.ResultUpdateInput = {
          wcaResultId: result.id,
          pos: result.pos,
          attempts: result.attempts,
          best: result.best,
          average: result.average,
          source: ResultSource.WCA_OFFICIAL,
          date: comp.start_date,
        };

        return prisma.result.update({
          where: {
            personIdCER: where,
          },
          data,
        });
      }),
    );
  });

  return comp;
};

/**
 * Links wcaIds to users based on the wcaUserId
 * Makes name and country changes if necessary
 */
async function upsertCompetitors(
  competitionId: string,
  users: SimpleApiUser[],
) {
  Promise.all(
    users.map(async (user) => {
      if (user instanceof Error) {
        return;
      }

      const update: Prisma.PersonUpdateInput = {
        name: user.name,
        wcaId: user.wca_id,
        Competitions: {
          connect: {
            wcaId: competitionId,
          },
        },
      };

      const create: Prisma.PersonUncheckedCreateInput = {
        ...update,
        countryIso2: user.country_iso2,
        name: user.name,
        wcaUserId: user.id,
        wcaId: user.wca_id,
      };

      return prisma.person.upsert({
        where: {
          wcaUserId_countryIso2: {
            wcaUserId: user.id,
            countryIso2: user.country_iso2,
          },
        },
        create: create,
        update: update,
      });
    }),
  );
}
