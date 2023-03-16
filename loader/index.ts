import '@ungap/global-this';
import { clientLoader, RemoteConfig } from './client';

import { retry, RetryPolicy } from './retry';
import { serverLoader } from './server';

type CacheItem = {
  url: string;
  promise: Promise<unknown>;
};

export const cache = new Map<string, CacheItem>();

type LoaderOptions = {
  remoteConfig: RemoteConfig;
  cacheKey: string;
  retryPolicy?: RetryPolicy;
};

export const loadInClient = <T>(options: LoaderOptions) =>
  loadFromCache<T>({
    ...options,
    loader: clientLoader,
  });

export const loadInServer = <T>(options: LoaderOptions) =>
  loadFromCache<T>({
    ...options,
    loader: serverLoader,
  });

type BundleLoader<T> = (props: RemoteConfig) => Promise<T>;

const loadFromCache = async <T>({
  remoteConfig,
  cacheKey,
  loader,
  retryPolicy = {
    maxRetries: 0,
    delayInMs: 0,
  },
}: LoaderOptions & {
  loader: BundleLoader<T>;
}): Promise<T> => {
  const { url, tinyFrontendName, dependenciesMap } = remoteConfig;

  const cacheItem = cache.get(cacheKey);
  // item exists in cache, so return from cache.
  if (cacheItem && cacheItem.url === url) {
    return cacheItem.promise as Promise<T>;
  }

  const remote = retry(
    () =>
      loader({
        url,
        dependenciesMap,
        tinyFrontendName,
      }),
    retryPolicy
  ).catch((err) => {
    cache.delete(cacheKey);
    throw err;
  });

  cache.set(cacheKey, {
    url,
    promise: remote,
  });

  return remote;
};

declare global {
  function define(
    deps: string[],
    moduleFactory: (...args: unknown[]) => any
  ): void;

  interface Window {
    tinyFrontendDeps: Record<string, unknown>;
    tinyFrontendExports: Record<string, unknown>;
  }
}
