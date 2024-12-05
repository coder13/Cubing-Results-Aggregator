import { WcaApi } from "@datasources/wca";
import { Continent, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const Continents: Continent[] = [
  {
    id: "_Africa",
    name: "Africa",
    recordName: "AfR",
  },
  {
    id: "_Asia",
    name: "Asia",
    recordName: "AsR",
  },
  {
    id: "_Europe",
    name: "Europe",
    recordName: "ER",
  },
  {
    id: "_North America",
    name: "North America",
    recordName: "NAR",
  },
  {
    id: "_Oceania",
    name: "Oceania",
    recordName: "OcR",
  },
  {
    id: "_South America",
    name: "South America",
    recordName: "SAR",
  },
  {
    id: "_Multiple Continents",
    name: "Multiple Continents",
    recordName: null,
  },
];

async function main() {
  const wcaApi = new WcaApi();
  const countries = await wcaApi.getCountries();

  const newContinents = await prisma.continent.createMany({
    data: Continents,
    skipDuplicates: true,
  });

  console.log(`Created ${newContinents.count} continents`);

  const newCountries = await prisma.country.createMany({
    data: countries.map((country) => ({
      id: country.iso2,
      name: country.name,
      continentId: country.continentId,
      iso2: country.iso2,
    })),
    skipDuplicates: true,
  });

  console.log(`Created ${newCountries.count} countries`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
