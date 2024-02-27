"use strict";

import { expect } from "chai";
import MicroBatch from "../src/index";
import { Job, JobResult } from "../src/types";

// Implement BatchProcessor
class BatchProcessor {
  processJobs(jobs: Job[]): Promise<JobResult>[] {
    return jobs.map(
      (job) =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            // console.log(`Processed job ${job.id}`);
            if (job.shouldFail) {
              reject({
                jobId: job.id,
                result: false,
                reason: "Failing job for testing",
              });
            }
            resolve({
              jobId: job.id,
              result: true,
            });
          }, 200);
        })
    );
  }
}

describe("Micro Batch", () => {
  let dummyBatchProcessor: BatchProcessor, mb: MicroBatch;

  beforeEach(() => {
    // Initialise MicroBatch
    dummyBatchProcessor = new BatchProcessor();
    mb = new MicroBatch(dummyBatchProcessor, 3, 500); // Configure MicroBatch
  });

  it("should not process in batch when job size is 0", () => {
    expect(mb.jobs.size).to.equal(0);
    expect(mb.jobResults.length).to.equal(0);
  });

  it("should process all accepted jobs in batch and return successful / failure job result", () => {
    const expectedResult = [
      { jobId: "0", result: true },
      { jobId: "1", result: true },
      { jobId: "2", result: false, reason: "Failing job for testing" },
      { jobId: "3", result: false, reason: "Failing job for testing" },
      { jobId: "4", result: true },
    ];

    for (let i = 0; i < 6; i++) {
      if (i === 2 || i === 3) {
        mb.submitJob({ id: `${i}`, shouldFail: true }).then((result) =>
          expect(result).to.deep.equal(expectedResult[i])
        ); // Fail job 2 & 3
      } else {
        mb.submitJob({ id: `${i}` }).then((result) =>
          expect(result).to.deep.equal(expectedResult[i])
        );
      }
    }
    mb.shutdown(); // Shutdown
  });

  it("should process previously accpeted jobs after shutdown", () => {
    const expectedResult = [
      { jobId: "0", result: true },
      { jobId: "1", result: true },
      { jobId: "2", result: true },
    ];
    for (let i = 0; i < 3; i++) {
      mb.submitJob({ id: `${i}` }).then((result) =>
        expect(result).to.deep.equal(expectedResult[i])
      );
    }
    mb.shutdown();
    for (let i = 3; i < 6; i++) {
      mb.submitJob({ id: `${i}` }).catch((error) =>
        expect(error).to.equal("Micro Batch service is closed")
      ); // These jobs won't be submitted or processed after shutdown
    }
  });
});
