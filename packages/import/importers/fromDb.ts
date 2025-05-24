import mysql from "mysql";
import { prisma } from "../lib/db";
const connection = mysql.createConnection({
  host: "0.0.0.0",
  user: "user",
  password: "password",
  database: "wca",
});

const BATCH_SIZE = 1000;

const fetchAndImportBatch = async (offset: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT 
        id,
        wca_id as wcaId,
        name,
        countryId,
        gender
      FROM Persons
      LIMIT ${BATCH_SIZE} OFFSET ${offset}`,
      async (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          if (results.length === 0) {
            resolve(0);
            return;
          }

          await prisma.person.createMany({
            data: results.map(
              (person: {
                wcaId: string;
                name: string;
                countryId: string;
                gender: string;
              }) => ({
                wcaId: person.wcaId,
                name: person.name,
                countryIso2: person.countryId,
                gender: person.gender,
              }),
            ),
            skipDuplicates: true,
          });
          console.log(`Imported batch of ${results.length} persons`);
          resolve(results.length);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
};

const main = async () => {
  connection.connect();

  // fetch all persons from wca_persons

  let offset = 0;
  let totalImported = 0;

  try {
    while (true) {
      const batchCount = await fetchAndImportBatch(offset);
      if (batchCount === 0) break;

      totalImported += batchCount;
      offset += BATCH_SIZE;
    }
    console.log(`Finished importing ${totalImported} persons`);
  } catch (e) {
    console.error("Error importing persons:", e);
  }

  connection.end();
};

main();
