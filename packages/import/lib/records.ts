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

// export const updateRecords = async (competitionId: string) => {
//   const competition = await prisma.competition.findUnique({
//     where: {
//       wcaId: competitionId,
//     },
//     include: {
//       Results: {
//         include: {
//           Person: true,
//         },
//       },
//       Competitors: true,
//     },
//   });
// const allRecords = getRecords(
// };
