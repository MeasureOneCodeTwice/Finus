//
export interface updateResponse {
  lastUpdated?: Date;
  id?: number;
}

export interface projectedDataResponse {
  dataPoint: number[];
  dateLabel: string[];
}
