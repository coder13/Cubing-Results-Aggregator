import { Competition } from "@wca/helpers";
import { ApiCompetition, ApiResult } from "./types";

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

  async getCompetitions() {
    return this.get<ApiCompetition[]>(`/competitions`);
  }

  async getCompetitionById(competitionId: string) {
    return this.get<ApiCompetition>(`/competitions/${competitionId}`);
  }

  async getResultsByCompetitionId(competitionId: string) {
    return this.get<ApiResult[]>(`/competitions/${competitionId}/results`);
  }

  async getWcifByCompetitionId(competitionId: string) {
    return this.get<Competition>(`/competitions/${competitionId}/wcif/public`);
  }
}
