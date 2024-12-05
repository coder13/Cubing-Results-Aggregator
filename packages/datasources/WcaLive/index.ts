import { WcaLiveResultsResponse } from "./types";

export class WcaLiveApi {
  constructor(
    private readonly baseUrl: string = "https://live.worldcubeassociation.org/api",
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

  getResultsByCompetitionId(competitionId: string) {
    return this.get<WcaLiveResultsResponse>(
      `/competitions/${competitionId}/results`,
    );
  }
}
