import { importFromWca } from "../importers/fromWca";
import { importFromWcaLegacy } from "../importers/fromWcaLegacy";
import { importFromWcaLive } from "../importers/fromWcaLive";
import { importFromWcif } from "../importers/fromWcif";
// import { recalculateRecords } from "../lib/records";
import { wcaApi } from "../lib/wcaApi";

const importerInput = process.argv[2];
// const page = process.argv[3];
// const competitionIdParam = process.argv[3];

const getImporter = (importer: string) => {
  switch (importer) {
    case "wca-live":
      return importFromWcaLive;
    case "wcif":
      return importFromWcif;
    case "wca-legacy":
      return importFromWcaLegacy;
    case "wca":
      return importFromWca;
    default:
      throw new Error(`Unknown importer ${importer}`);
  }
};

const main = async () => {
  const importer = getImporter(importerInput);

  let page = 4;

  while (true) {
    const comps = await wcaApi.getCompetitions({
      sort: "start_date",
      page: page,
    });

    if (comps.length === 0) {
      break;
    }

    // const startDates = new Set<string>();
    for (const comp of comps) {
      await importer(comp.id);
      // startDates.add(comp.start_date);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));

    page++;
  }

  // console.log("Recalculating records for the following dates:", startDates);

  // for (const date of startDates) {
  //   await recalculateRecords(date);
  // }
};

main();
