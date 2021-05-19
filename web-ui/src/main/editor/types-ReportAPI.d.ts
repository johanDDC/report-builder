declare interface MongoProjection {
  elemMatch: string;
  exclude: string[];
  excludeId: boolean;
  include: string[];
  slice: {
    fieldName: string,
    skip?: number,
    limit: number,
  };
}

declare interface ReportAPI {
  query(query: {}, context: any, projection?: MongoProjection, limit?: number, offset?: number, sort?: {}): any[]

  logInfo(text: string): void

  logError(text: string): void

  logException(exception: any): void

  /**
   * Search sources for the text '@breakpoint'
   */
  breakpoint(): void

  table(data: {}[] , name?: string, headColumns?: string[]): void

  configure(headColumns?: string[]): void
}

declare const env: ReportAPI