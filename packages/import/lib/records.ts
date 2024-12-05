import { Prisma, RecordType, RegionType } from "@prisma/client";
import { prisma } from "./db";

/**
 * Returns all non-personal records for a given date
 */
export const getRecords = async (date: string) => {
  const records = await prisma.records.findMany({
    include: {
      Result: {
        include: {
          Person: true,
        },
      },
    },
    where: {
      AND: [
        {
          valid_from: {
            lte: date,
          },
        },
        {
          valid_to: {
            gte: date,
          },
        },
        {
          regionType: {
            not: "PERSONAL",
          },
        },
      ],
    },
  });

  return records;
};

/**
 * Returns all personal records for a given date and set of persons
 */
export const getPersonalRecords = async (
  date: string,
  personWcaIds: string[],
) => {
  const records = await prisma.records.findMany({
    include: {
      Result: {
        include: {
          Person: true,
        },
      },
    },
    where: {
      AND: [
        {
          valid_from: {
            lte: date,
          },
        },
        {
          valid_to: {
            gte: date,
          },
        },
        {
          Result: {
            Person: {
              wcaId: {
                in: personWcaIds,
              },
            },
          },
        },
      ],
    },
  });

  return records;
};

export const updateRecords = async (competitionId: string) => {
  const competition = await prisma.competition.findUnique({
    where: {
      wcaId: competitionId,
    },
    include: {
      Results: {
        include: {
          Records: true,
          Person: true,
        },
      },
      Competitors: true,
    },
  });

  console.log(99, competition?.eventIds);

  if (!competition) {
    throw new Error(`Competition ${competitionId} not found`);
  }

  // need to catch records that were active on the date of the comp and after
  const dateWhere = {
    OR: [
      // active on the date of the competition
      // valid_from <= competition.startDate
      // valid_to >= competition.startDate OR valid_to is null [meaning it's still active]
      // This should only catch 1 record for each region type
      {
        AND: [
          {
            valid_from: { lte: competition.startDate },
          },
          {
            OR: [
              {
                valid_to: { gte: competition.startDate },
              },
              { valid_to: null },
            ],
          },
        ],
      },
      // active after the date of the competition
      {
        AND: [
          {
            valid_from: { gte: competition.startDate },
          },
        ],
      },
    ],
  };

  const getRecords = async (
    eventId: string,
    input: Prisma.RecordsWhereInput,
  ) => {
    return await prisma.records.findMany({
      include: {
        Result: {
          include: {
            Person: true,
          },
        },
      },
      where: {
        AND: [input, { eventId }, dateWhere],
      },
      orderBy: {
        valid_from: "asc",
      },
    });
  };

  await prisma.$transaction(async () => {
    for (const eventId of competition.eventIds) {
      console.log(159, eventId);
      const results = competition.Results.filter((r) => r.eventId === eventId);

      console.log(159, results.length);

      if (results.length === 0) {
        continue;
      }

      // update WRs
      const WRs = await getRecords(eventId, { regionType: RegionType.WORLD });

      // find the WR right before the competition
      const singleWRs = WRs.filter(
        (r) =>
          r.type === RecordType.SINGLE && r.valid_from <= competition.startDate,
      );
      const singleWR = singleWRs[0];

      //   single
      const bestCompSingle = results
        .filter((r) => r.best)
        .reduce((best, r) => (r.best! < best.best! ? r : best), results[0]);

      console.log(bestCompSingle);

      if (!singleWR || !singleWR.Result.best) {
        // set bestCompSingle as the WR
        await prisma.records.upsert({
          where: {
            resultId_eventId_type_regionType: {
              resultId: bestCompSingle.id,
              eventId,
              type: RecordType.SINGLE,
              regionType: RegionType.WORLD,
            },
          },
          create: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
            eventId,
            regionType: RegionType.WORLD,
            type: RecordType.SINGLE,
            valid_from: competition.startDate,
          },
          // update nothing, just make sure this result exists
          update: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
          },
        });
      } else if (bestCompSingle.best === singleWR.Result.best) {
        // create new tied WR
        await prisma.records.upsert({
          where: {
            resultId_eventId_type_regionType: {
              resultId: bestCompSingle.id,
              eventId,
              type: RecordType.SINGLE,
              regionType: RegionType.WORLD,
            },
          },
          create: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
            eventId,
            regionType: RegionType.WORLD,
            type: RecordType.SINGLE,
            valid_from: competition.startDate,
          },
          // update nothing, just make sure this result exists
          update: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
          },
        });
      } else if (bestCompSingle.best < singleWR.Result.best) {
        // terminate current WRs
        await prisma.records.updateMany({
          where: {
            eventId,
            type: RecordType.SINGLE,
            regionType: RegionType.WORLD,
            resultId: {
              in: singleWRs.map((r) => r.resultId),
            },
          },
          data: {
            valid_to: competition.startDate,
          },
        });

        // create new WR
        await prisma.records.upsert({
          where: {
            resultId_eventId_type_regionType: {
              resultId: bestCompSingle.id,
              eventId,
              type: RecordType.SINGLE,
              regionType: RegionType.WORLD,
            },
          },
          create: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
            eventId,
            regionType: RegionType.WORLD,
            type: RecordType.SINGLE,
            valid_from: competition.startDate,
          },
          // update nothing, just make sure this result exists
          update: {
            Result: {
              connect: {
                id: bestCompSingle.id,
              },
            },
          },
        });
      }

      //   average

      // update CRs
      // update NRs
      // update PRs
    }
  });
};
