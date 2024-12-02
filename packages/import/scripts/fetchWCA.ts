import { importFromWcif } from "../lib/importers.ts/fromWcif";

const competitionIdParam = process.argv[2];

const main = async () => {
  importFromWcif(competitionIdParam);
};

main();
