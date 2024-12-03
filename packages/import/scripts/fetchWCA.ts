import { importFromWcaLive } from "../lib/importers.ts/fromWcaLive";

const competitionIdParam = process.argv[2];

const main = async () => {
  importFromWcaLive(competitionIdParam);
};

main();
