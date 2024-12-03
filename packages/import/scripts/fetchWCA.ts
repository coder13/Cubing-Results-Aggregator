import { importFromWcaLegacy } from "../lib/importers.ts/fromWcaLegacy";
import { importFromWcaLive } from "../lib/importers.ts/fromWcaLive";
import { importFromWcif } from "../lib/importers.ts/fromWcif";

const importer = process.argv[2];
const competitionIdParam = process.argv[3];

const main = async () => {
  switch (importer) {
    case "wca-live":
      return importFromWcaLive(competitionIdParam);
    case "wcif":
      return importFromWcif(competitionIdParam);
    case "wca":
      return importFromWcaLegacy(competitionIdParam);
    default:
      throw new Error(`Unknown importer ${importer}`);
  }
};

main();
