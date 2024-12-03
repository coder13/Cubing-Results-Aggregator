export interface WcaLiveResultsResponse {
  events: WcaLiveResultsEvent[];
  persons: WcaLiveResultsPerson[];
}

export interface WcaLiveResultsEvent {
  eventId: string;
  rounds: WcaLiveResultsRound[];
}

export interface WcaLiveResultsRound {
  number: number;
  results: WcaLiveResultsResult[];
}

export interface WcaLiveResultsResult {
  personId: number;
  best: number;
  average: number;
  attempts: number[];
  ranking: number;
}

export interface WcaLiveResultsPerson {
  id: number;
  name: string;
  country: string;
  wcaId: string;
}
