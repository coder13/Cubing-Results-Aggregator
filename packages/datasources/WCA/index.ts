import { Competition } from "@wca/helpers";
import { ApiCompetition, APIPerson, ApiResult } from "./types";

export class WcaApi {
  constructor(
    private readonly baseUrl: string = "https://api.worldcubeassociation.org",
  ) {}

  async fetch<T>(path: string, options = {}) {
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
}
