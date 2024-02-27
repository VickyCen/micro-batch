"use strict";

import JobsQueue from "./jobsQueue";
import { BatchProcessor, Job, JobResult } from "./types";

class MicroBatch {
  batchSize: number;
  batchTimeout: number;
  jobs: JobsQueue;
  jobResults: Promise<JobResult>[];
  isTerminated: boolean;
  bp: BatchProcessor;
  timerId: NodeJS.Timeout | number | null;

  constructor(
    batchProcessor: BatchProcessor,
    size?: number,
    batchTimeout?: number
  ) {
    this.batchSize = size || 50; // batch size
    this.batchTimeout = batchTimeout || 500; // frequency - milliseconds
    this.jobs = new JobsQueue(); // jobs queue
    this.jobResults = []; // store jobs results
    this.isTerminated = false; // indicate the service is shutdown
    this.bp = batchProcessor; // external dependencies
    this.timerId = null; // timer for batch process
  }

  /* Start the batch process timer */
  start(): Promise<any> {
    return new Promise(() => {
      if (!this.timerId) {
        this.timerId = setInterval(() => {
          // Batch process jobs
          this.batchProcess();
        }, this.batchTimeout);
      }
    });
  }

  /* Check individual job result */
  checkResult(index: number, resolve: any): void {
    setTimeout(async () => {
      if (this.jobResults[index] !== undefined) {
        const result = await this.jobResults[index].catch((error) =>
          resolve(error)
        );
        resolve(result);
      } else {
        this.checkResult(index, resolve);
      }
    }, this.batchTimeout);
  }

  /* Submit a job into the job queue */
  submitJob(job: Job): Promise<JobResult> {
    if (this.isTerminated) {
      return Promise.reject("Micro Batch service is closed");
    }
    const index = this.jobs.enqueue(job);
    if (index === 0) this.start();
    return new Promise((resolve, reject) => {
      this.checkResult(index, resolve);
    });
  }

  /* Batch processing executor */
  batchProcess(): void {
    let jobsToProcess = [];
    if (this.jobs.size === 0) {
      // Remove timer
      clearInterval(this.timerId as number);
      this.timerId = null;
      return;
    }
    const len =
      this.jobs.size < this.batchSize ? this.jobs.size : this.batchSize;
    for (let i = 0; i < len; i++) {
      const currentJob = this.jobs.dequeue();
      if (currentJob) {
        jobsToProcess.push(currentJob);
      }
    }
    const results = this.bp.processJobs(jobsToProcess);
    results.map((results: Promise<JobResult>) => this.jobResults.push(results));
  }

  /* Flush the job & result queue */
  flush(): void {
    // Handle this after shut down
    this.jobs.reset();
    this.jobResults = [];
  }

  /* Shut down this service */
  shutdown(): void {
    this.isTerminated = true;

    // Flush
    while (this.jobs.size) {
      this.batchProcess();
    }
    this.getResults().finally(() => {
      this.flush();
    });
  }

  getResults() {
    return Promise.allSettled(this.jobResults);
  }
}

export default MicroBatch;
