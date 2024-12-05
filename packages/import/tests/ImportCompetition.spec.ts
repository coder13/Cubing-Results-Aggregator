import nock from "nock";
import { prisma } from "../lib/db";
import { upsertCompetition } from "../lib/helpers";
import { WcaApi } from "@datasources/wca";

const CompetitionId = "test-competition-id";

const mockApi = nock("https://api.worldcubeassociation.org");
const api = new WcaApi();

describe("upsertCompetition", () => {
  mockApi.get(new RegExp(`/competitions/.*`)).reply(200, {
    id: CompetitionId,
    name: "Test Competition",
    city: "Seattle",
    country_iso2: "US",
    start_date: "2021-01-01",
    end_date: "2021-01-02",
    cancelled_at: null,
    eventIds: ["333", "222", "444"],
  });

  it("should import from wca into a fresh database", async () => {
    mockApi.get(`/competitions/${CompetitionId}/results`).reply(200, []);
    mockApi.get(`/competitions/${CompetitionId}/competitors`).reply(200, []);

    const comp = await api.getCompetitionById(CompetitionId);

    await upsertCompetition(comp);

    const competition = await prisma.competition.findUnique({
      include: {
        Competitors: true,
        Results: true,
      },
      where: { wcaId: CompetitionId },
    });

    expect(competition).toBeDefined();
    expect(competition?.name).toBe("Test Competition");
    expect(competition?.cityName).toBe("Seattle");
    expect(competition?.countryId).toBe("US");
    expect(competition?.Competitors).toHaveLength(0);
    expect(competition?.Results).toHaveLength(0);
  });
});
