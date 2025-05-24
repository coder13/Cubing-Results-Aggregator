import { Prisma, Record, RecordType, RegionType, Result } from "@prisma/client";
import { prisma } from "./db";

/**
 * Returns all non-personal records for a given date
 */
export const getRecords = async (date: string) => {
  const records = await prisma.record.findMany({
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
  const records = await prisma.record.findMany({
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

const getBestResults = <T extends Result>(type: RecordType, results: T[]) => {
  if (!results.length) {
    return undefined;
  }

  const prop = type === RecordType.SINGLE ? "best" : "average";

  const bestTime = results
    .filter((r) => r[prop] && r[prop] > 0)
    .reduce((best, r) => {
      const time = r[prop];
      return time && time < best[prop]! ? r : best;
    }, results[0]);

  return results.filter((r) => r.best === bestTime?.best);
};

export const recalculateRecords = async (date: string) => {
  const recordsToBeCreated: Prisma.RecordCreateManyInput[] = [];
  // find all results that were active on the date of the competition
  const results = await prisma.result.findMany({
    include: {
      Person: {
        include: {
          Country: {
            include: {
              Continent: true,
            },
          },
        },
      },
    },
    where: {
      Competition: {
        // All comps where start date and end date overlap with date
        startDate: {
          lte: date,
        },
        endDate: {
          gte: date,
        },
      },
      best: {
        gt: 0,
      },
    },
  });

  if (results.length === 0) {
    throw new Error(`No Results found for ${date}`);
  }

  const eventIds = results.reduce((acc, r) => {
    if (!acc.includes(r.eventId)) {
      acc.push(r.eventId);
    }
    return acc;
  }, [] as string[]);

  const continents = results.reduce((acc, r) => {
    if (!acc.includes(r.Person.Country.Continent.id)) {
      acc.push(r.Person.Country.Continent.id);
    }
    return acc;
  }, [] as string[]);

  const countries = results.reduce((acc, r) => {
    if (!acc.includes(r.Person.Country.id)) {
      acc.push(r.Person.Country.id);
    }
    return acc;
  }, [] as string[]);

  const personWcaIds = results
    .filter((r) => !!r.Person.wcaId)
    .reduce((acc, r) => {
      if (!acc.includes(r.Person.wcaId!)) {
        acc.push(r.Person.wcaId!);
      }
      return acc;
    }, [] as string[]);

  console.log(`Updating records for ${date} across events: ${eventIds.length}`);

  // need to catch records that were active on the date of the comp and after
  const dateWhere = {
    OR: [
      // active on the date of the competition
      // valid_from <= date
      // valid_to >= date OR valid_to is null [meaning it's still active]
      // This should only catch 1 record for each region type
      {
        AND: [
          {
            valid_from: { lte: date },
          },
          {
            OR: [
              {
                valid_to: { gte: date },
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
            valid_from: { gte: date },
          },
        ],
      },
    ],
  };

  const getRecords = async (input: Prisma.RecordWhereInput) =>
    prisma.record.findMany({
      include: {
        Result: {
          include: {
            Person: true,
          },
        },
      },
      where: {
        AND: [input, dateWhere],
      },
      orderBy: {
        valid_from: "asc",
      },
    });

  await prisma.$transaction(
    async () => {
      for (const eventId of eventIds) {
        console.log(159, eventId);
        const eventResults = results.filter((r) => r.eventId === eventId);

        console.log(159, eventResults.length);

        if (eventResults.length === 0) {
          continue;
        }

        // Recalculate World Records
        const WRs = await getRecords({ eventId, regionType: RegionType.WORLD });

        for (const recordType of [RecordType.SINGLE, RecordType.AVERAGE]) {
          // find the WR right before the competition
          const records = WRs.filter(
            (r) => r.type === recordType && r.valid_from <= date,
          );

          const bestResults = getBestResults(recordType, eventResults);
          const newRecords = await updateRecords(
            { regionType: RegionType.WORLD, type: recordType },
            records,
            bestResults,
          );
          if (newRecords) {
            recordsToBeCreated.push(...newRecords);
          }
        }

        // Recalculate Continental Records

        for (const continentId of continents) {
          console.log(`Calulating for continent ${continentId}`);
          const CRs = await getRecords({
            eventId,
            regionType: RegionType.CONTINENT,
            continentId,
          });

          for (const recordType of [RecordType.SINGLE, RecordType.AVERAGE]) {
            // find the WR right before the competition
            const records = CRs.filter(
              (r) => r.type === recordType && r.valid_from <= date,
            );

            //   single
            const bestResults = getBestResults(recordType, eventResults);
            const newRecords = await updateRecords(
              {
                regionType: RegionType.CONTINENT,
                type: recordType,
                continentId,
              },
              records,
              bestResults,
            );
            if (newRecords) {
              recordsToBeCreated.push(...newRecords);
            }
          }
        }

        for (const countryId of countries) {
          console.log(`Calulating for continent ${countryId}`);
          const NRs = await getRecords({
            eventId,
            regionType: RegionType.COUNTRY,
            countryId,
          });

          for (const recordType of [RecordType.SINGLE, RecordType.AVERAGE]) {
            const records = NRs.filter(
              (r) => r.type === recordType && r.valid_from <= date,
            );

            const bestResults = getBestResults(recordType, eventResults);
            const newRecords = await updateRecords(
              {
                regionType: RegionType.COUNTRY,
                type: recordType,
                countryId,
              },
              records,
              bestResults,
            );

            if (newRecords) {
              recordsToBeCreated.push(...newRecords);
            }
          }
        }
      }
      for (const wcaId of personWcaIds) {
        // console.log(`Calulating PRs for person ${wcaId}`);

        const PRs = await getRecords({
          regionType: RegionType.PERSONAL,
          Result: {
            Person: {
              wcaId,
            },
          },
        });

        for (const eventId of eventIds) {
          const eventResults = results.filter(
            (r) => r.eventId === eventId && r.Person.wcaId === wcaId,
          );

          for (const recordType of [RecordType.SINGLE, RecordType.AVERAGE]) {
            const records = PRs.filter(
              (r) =>
                r.eventId === eventId &&
                r.type === recordType &&
                r.valid_from <= date,
            );

            const bestResults = getBestResults(recordType, eventResults);
            const newRecords = await updateRecords(
              {
                regionType: RegionType.PERSONAL,
                type: recordType,
              },
              records,
              bestResults,
            );

            if (newRecords) {
              recordsToBeCreated.push(...newRecords);
            }
          }
        }
      }

      if (recordsToBeCreated.length > 0) {
        await prisma.record.createMany({
          data: recordsToBeCreated,
          skipDuplicates: true,
        });
      }
    },
    {
      timeout: 30 * 1000,
      maxWait: 30 * 1000,
    },
  );
};

/**
 * Determines if a result ties or beats the current record, terminates current records, and creates new records
 * Returns a list of new records to be created
 */
export const updateRecords = async (
  {
    regionType,
    type,
    continentId,
    countryId,
  }: Pick<
    Prisma.RecordUncheckedCreateInput,
    "regionType" | "type" | "continentId" | "countryId"
  >,
  currentRecords: (Record & { Result: Result })[],
  bestResults?: Result[],
): Promise<Prisma.RecordCreateManyInput[]> => {
  const prop = type === RecordType.SINGLE ? "best" : "average";

  if (!bestResults) {
    return [];
  }

  const bestTime = bestResults[0][prop];

  if (!bestTime) {
    return [];
  }

  // If the record doesn't exist, make best Result the new record
  if (currentRecords.length === 0) {
    // set bestOverallSingle as the WR
    return bestResults.map((bestResult) =>
      createCreateRecordInput({
        regionType,
        type,
        resultId: bestResult.id,
        eventId: bestResult.eventId,
        date: bestResult.date,
      }),
    );
    // return Promise.all(
    //   bestResults.map(async (bestResult) => {
    //     const create: Prisma.RecordCreateInput = {
    //       Result: {
    //         connect: {
    //           id: bestResult.id,
    //         },
    //       },
    //       eventId: bestResult.eventId,
    //       regionType,
    //       type,
    //       valid_from: bestResult.date,
    //       ...(continentId && {
    //         Continent: {
    //           connect: {
    //             id: continentId,
    //           },
    //         },
    //       }),
    //       ...(countryId && {
    //         Country: {
    //           connect: {
    //             id: countryId,
    //           },
    //         },
    //       }),
    //     };

    //     return await prisma.record.upsert({
    //       where: {
    //         resultId_type_regionType: {
    //           resultId: bestResult.id,
    //           regionType,
    //           type,
    //         },
    //       },
    //       create,
    //       update: {},
    //     });
    //   })
    // );
  }

  const recordTime = currentRecords[0].Result[prop];

  if (!recordTime) {
    return [];
  }

  if (bestTime === recordTime) {
    // create new tied records (if not exist)
    // return await createNewRecords(bestResults, {
    //   regionType,
    //   type,
    //   continentId,
    //   countryId,
    // });
    return bestResults.map((bestResult) =>
      createCreateRecordInput({
        regionType,
        type,
        resultId: bestResult.id,
        eventId: bestResult.eventId,
        date: bestResult.date,
        continentId: continentId || undefined,
        countryId: countryId || undefined,
      }),
    );
  }

  if (bestTime < recordTime) {
    // terminate current WRs
    await prisma.record.updateMany({
      where: {
        regionType,
        type,
        resultId: {
          in: currentRecords.map((r) => r.resultId),
        },
      },
      data: {
        valid_to: bestResults[0].date,
      },
    });

    return bestResults.map((bestResult) =>
      createCreateRecordInput({
        regionType,
        type,
        resultId: bestResult.id,
        eventId: bestResult.eventId,
        date: bestResult.date,
        continentId: continentId || undefined,
        countryId: countryId || undefined,
      }),
    );

    // create new WR
    // await createNewRecords(bestResults, {
    //   regionType,
    //   type,
    //   continentId,
    //   countryId,
    // });
    // bestResults.forEach((bestResult) => {
    //   newRecords.push({
  }
  return [];
};

/**
 * For a set of results, creates them as records if they don't already exist
 */
export const createNewRecords = async (
  results: Result[],
  {
    regionType,
    type,
    continentId,
    countryId,
  }: Pick<
    Prisma.RecordUncheckedCreateInput,
    "regionType" | "type" | "continentId" | "countryId"
  >,
) => {
  return Promise.all(
    results.map(async (result) => {
      return await prisma.record.upsert({
        where: {
          resultId_type_regionType: {
            resultId: result.id,
            regionType: regionType,
            type: type,
          },
        },
        create: {
          Result: {
            connect: {
              id: result.id,
            },
          },
          eventId: result.eventId,
          regionType,
          type,
          ...(continentId && {
            Continent: {
              connect: {
                id: continentId,
              },
            },
          }),
          ...(countryId && {
            Country: {
              connect: {
                id: countryId,
              },
            },
          }),
          valid_from: result.date,
        },
        // update nothing, just make sure this result exists
        update: {},
      });
    }),
  );
};

export const createCreateRecordInput = ({
  regionType,
  type,
  continentId,
  countryId,
  resultId,
  eventId,
  date,
}: {
  regionType: RegionType;
  type: RecordType;
  resultId: number;
  eventId: string;
  date: string;
  continentId?: string;
  countryId?: string;
}): Prisma.RecordCreateManyInput => {
  return {
    // Result: {
    //   connect: {
    //     id: resultId,
    //   },
    // },
    resultId,
    eventId,
    regionType,
    type,
    valid_from: date,
    continentId,
    countryId,
    // ...(continentId && {
    //   Continent: {
    //     connect: {
    //       id: continentId,
    //     },
    //   },
    // }),
    // ...(countryId && {
    //   Country: {
    //     connect: {
    //       id: countryId,
    //     },
    //   },
    // }),
  };
};
