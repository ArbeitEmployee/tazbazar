// Share one in-flight request between effects that fire in the same tick.
// React StrictMode (and multiple components asking for the same public data)
// otherwise fires identical API calls twice. This only dedupes requests that
// are still pending; a later, intentional refresh still hits the network.
const pendingRequests = new Map();

export const dedupeRequest = (key, factory) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = Promise.resolve()
    .then(factory)
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
};
