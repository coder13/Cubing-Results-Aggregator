import { Competition } from "@wca/helpers";
import { ApiCompetition, APIPerson, ApiResult, SimpleApiUser } from "./types";
import DataLoader from "dataloader";

export class WcaApi {
  public userLoader: DataLoader<number, SimpleApiUser>;

  constructor(
    private readonly baseUrl: string = "https://api.worldcubeassociation.org",
  ) {
    this.userLoader = new DataLoader(
      async (keys) => await this.getUsers(keys),
      {
        maxBatchSize: 100,
      },
    );
  }

  async fetch<T>(path: string, options: RequestInit = {}) {
    console.log("Fetching", this.baseUrl, path.toString());
    const url = new URL(`${this.baseUrl}${path}`);

    const response = await fetch(url.toString(), options);
    return (await response.json()) as T;
  }

  async get<T>(path: string, params = {}, options = {}) {
    const searchParams = new URLSearchParams(params).toString();

    return this.fetch<T>(
      `${path}${searchParams && "?" + searchParams}`,
      options,
    );
  }

  async post<T>(path: string, body = {}, options = {}) {
    return this.fetch<T>(path, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async getCompetitions(params: {
    country_iso2?: string;
    start?: string;
    end?: string;
    ongoing_and_future?: string;
    sort?: string;
    page?: number;
    announced_after?: string;
  }) {
    return this.get<ApiCompetition[]>(`/competitions`, params);
  }

  async getCompetitionById(competitionId: string) {
    return this.get<ApiCompetition>(`/competitions/${competitionId}`);
  }

  async getResultsByCompetitionId(competitionId: string) {
    return this.get<ApiResult[]>(`/competitions/${competitionId}/results`);
  }
  async getCompetitorsByCompetitionId(competitionId: string) {
    return this.get<APIPerson[]>(`/competitions/${competitionId}/competitors`);
  }

  async getWcifByCompetitionId(competitionId: string) {
    return this.get<Competition>(`/competitions/${competitionId}/wcif/public`);
  }

  async getUsers(userIds: readonly number[]) {
    const { users } = await this.post<{ users: SimpleApiUser[] }>("/users", {
      ids: userIds,
    });
    return users;
  }

  async getCountries() {
    return this.get<
      {
        id: string;
        name: string;
        continentId: string;
        iso2: string;
      }[]
    >("/countries");
  }
}
