import { EventEmitter } from "stream";

const EVENTS = {
  RELEASE: "release",
};

export const lock = () => {
  let locked = false;
  const eventEmitter = new EventEmitter();

  return {
    acquire: () =>
      new Promise((resolve) => {
        if (!locked) {
          // If not locked, take the lock
          locked = true;
          return resolve(locked);
        }

        // Otherwise, wait until the lock is released
        const tryAcquireAfter = () => {
          if (!locked) {
            locked = true;
            eventEmitter.removeListener(EVENTS.RELEASE, tryAcquireAfter);
            return resolve(locked);
          }
        };
        eventEmitter.on(EVENTS.RELEASE, tryAcquireAfter);
      }),
    release: () => {
      locked = false;
      setImmediate(() => eventEmitter.emit(EVENTS.RELEASE));
    },
  };
};
