let queue: string[] = [];
let searchCache: Record<string, string> = {};

let repeat = false;
let current: string | undefined;

export const enqueue = (query: string) => {
  queue.push(query);
};

export const dequeue = () => {
  if (repeat) {
    return current;
  }

  current = queue.shift();

  return current;
};

export const toggleRepeat = (override?: boolean) => {
  if (override !== undefined) {
    repeat = override;
  } else {
    repeat = !repeat;
  }
  return repeat;
};

export const getRepeat = () => {
  return repeat;
}

export const setCurrent = (newCurrent: string) => {
  current = newCurrent;
};

export const getQueue = () => {
  return queue;
};

export const clear = () => {
  queue = [];
  current = '';
};

export const getFromSearchCache = (query: string): string | undefined => {
  return searchCache[query.toLowerCase().trim()];
};

export const updateSearchCache = (query: string, url: string) => {
  searchCache[query.toLowerCase().trim()] = url;
};

export const clearSearchCache = (query?: string | null) => {
  if (query) {
    delete searchCache[query.toLowerCase().trim()];
  } else {
    searchCache = {};
  }
};
