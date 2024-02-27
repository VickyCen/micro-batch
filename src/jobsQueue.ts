import { lock } from "./lock";
import { Job } from "./types";

class JobsQueue {
  queue: Array<Job>;
  lock: { acquire: () => Promise<unknown>; release: () => void };

  constructor() {
    this.queue = [];
    this.lock = lock();
  }

  enqueue(job: Job) {
    this.lock.acquire();
    this.queue.push(job);
    const index = this.queue.length - 1;
    this.lock.release();
    return index;
  }

  dequeue() {
    this.lock.acquire();
    const top = this.queue.shift();
    this.lock.release();
    return top;
  }

  reset() {
    this.lock.acquire();
    this.queue = [];
    this.lock.release();
  }

  get size() {
    return this.queue.length;
  }
}

export default JobsQueue;
