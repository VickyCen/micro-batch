# MicroBatch

This is a microbatch library that allows to group jobs into small batches, and process them in batch. Written in nodeJS.

## Usage

### Install

Download the repo, run "npm install" in root directory

### Dependency

This library depends on an external BatchProcessor, which you need to implement it with a **processJobs** method.

### Initialisation

To use the micro batcher, implement your BatchProcessor, and pass the BatchProcessor when creating an instance of MicroBatch.

By default, it will take 50 jobs in a batch and process a batch every 500 milliseconds.

You can also configure your batch size and frequency when initialising the microbatcher:

```
// Implement BatchProcessor
class BatchProcessor {

  // Implement the processJobs method
  processJobs(jobs: Job[]): Promise<JobResult>[] {
    return jobs.map(
      (job) =>
        new Promise((resolve, reject) => {
            resolve({
              jobId: job.id,
              result: true,
            });
        })
    );
  }
}

// Create your BatchProcessor instance
const batchProcessor = new BatchProcessor();

// Create a micro batch instance using batchProcessor
const mb = new MicroBatch(batchProcessor, 30, 2000);
// Configure MicroBatch with custom size of 30 and frequency of 2000 milliseconds

```

### Submit job

Use submitJob to submit a job, and it returns a promise which you can wait for the job result

```
// Submit a job
mb.submitJob({ id: "1" }).then((result) => console.log(result));

```

### Shut down the micro batcher

It provides a shutdown method which you can stop the micro batching service. After shutdown, all previously accepted jobs will still be processed.

```
// Submit a job
mb.submitJob({ id: "1" }).then((result) => console.log(result));

// Shutdown
mb.shutdown();

```

## Test

```
npm run test
```
