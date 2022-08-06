let queue: string[] = [];
let cache: Record<string, string> = {};

let repeat = false;
let current: string | undefined;

export const enqueue = (query: string) => {
  queue.push(query);
};

export const dequeue = (amount = 1) => {
  if (repeat) {
    return current;
  }

  for (let i = 0; i < amount; i++) {
    current = queue.shift();
  }

  return current;
};

export const toggleRepeat = (override?: boolean) => {
  if (override) {
    repeat = override;
  } else {
    repeat = !repeat;
  }
  return repeat;
};

export const setCurrent = (newCurrent: string) => {
  current = newCurrent;
};

export const getQueue = () => {
  return queue.map((item, index) => `${index}. ${item}`).join(' ');
};

export const clear = () => {
  queue = [];
  current = '';
};

export const getFromCache = (query: string): string | undefined => {
  return cache[query.toLowerCase().trim()];
};

export const updateCache = (query: string, url: string) => {
  cache[query.toLowerCase().trim()] = url;
};

export const clearCache = (query?: string | null) => {
  if (query) {
    delete cache[query.toLowerCase().trim()];
  } else {
    cache = {};
  }
};
