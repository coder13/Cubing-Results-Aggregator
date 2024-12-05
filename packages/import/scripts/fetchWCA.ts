import { importFromWca } from "../importers/fromWca";
import { importFromWcaLegacy } from "../importers/fromWcaLegacy";
import { importFromWcaLive } from "../importers/fromWcaLive";
import { importFromWcif } from "../importers/fromWcif";

const importer = process.argv[2];
const competitionIdParam = process.argv[3];

const main = async () => {
  switch (importer) {
    case "wca-live":
      return importFromWcaLive(competitionIdParam);
    case "wcif":
      return importFromWcif(competitionIdParam);
    case "wca-legacy":
      return importFromWcaLegacy(competitionIdParam);
    case "wca":
      return importFromWca(competitionIdParam);
    default:
      throw new Error(`Unknown importer ${importer}`);
  }
};

main();
