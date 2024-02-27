export type Job = {
  id: string;
  shouldFail?: boolean; // For testing only, to make a job processed successfully or fail it
};

export type JobResult = {
  jobId: string;
  result: boolean;
  error?: Error;
};

export type BatchProcessor = {
  processJobs: Function;
};