import { Competition } from "@wca/helpers";
import { ApiCompetition, APIPerson, ApiResult, SimpleApiUser } from "./types";
import DataLoader from "dataloader";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

export class WcaApi {
  public userLoader: DataLoader<number, SimpleApiUser>;
  private cache = new InMemoryLRUCache<object>({ max: 250 });

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
    console.log("Fetching", `${this.baseUrl}${path}`);
    const url = new URL(`${this.baseUrl}${path}`);

    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      console.error(await response.text());
      throw new Error(`Failed to fetch ${url.toString()} ${response.status}`);
    }
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

  async getCompetitions(
    params: {
      country_iso2?: string;
      start?: string;
      end?: string;
      ongoing_and_future?: string;
      sort?: string;
      page?: number;
      announced_after?: string;
    } = {},
  ) {
    const comps = await this.get<ApiCompetition[]>(`/competitions`, params);
    comps.forEach((comp) => this.cache.set(`competition/${comp.id}`, comp));
    return comps;
  }

  async getCompetitionById(competitionId: string) {
    const cacheKey = `competition/${competitionId}`;
    if (this.cache.keys().includes(cacheKey)) {
      return (await this.cache.get(cacheKey)) as ApiCompetition;
    }

    console.log(`comp ${competitionId} not in cache, fetching from source`);

    const res = await this.get<ApiCompetition>(
      `/competitions/${competitionId}`,
    );
    this.cache.set(cacheKey, res);
    return res;
  }

  async getResultsByCompetitionId(competitionId: string) {
    return this.get<ApiResult[]>(`/competitions/${competitionId}/results`);
  }
  async getCompetitorsByCompetitionId(competitionId: string) {
    return this.get<APIPerson[]>(`/competitions/${competitionId}/competitors`);
  }

  async getWcifByCompetitionId(competitionId: string) {
    const cacheKey = `wcif/${competitionId}`;
    if (this.cache.keys().includes(competitionId)) {
      return (await this.cache.get(cacheKey)) as Competition;
    }
    const wcif = this.get<Competition>(
      `/competitions/${competitionId}/wcif/public`,
    );
    this.cache.set(cacheKey, wcif);
    return wcif;
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
