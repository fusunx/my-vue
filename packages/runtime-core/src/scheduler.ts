const queue = [];
let isFlushing = false;

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    Promise.resolve().then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      for (let i = 0; i < copy.length; i++) {
        const job = copy[i];
        job();
      }
      copy.length = 0;
    });
  }
}
