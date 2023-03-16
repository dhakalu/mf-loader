import { RemoteConfig } from './client';
import { evaluate } from './evaluator';

export const serverLoader = async <T>({
  url,
  dependenciesMap,
}: RemoteConfig): Promise<T> => {
  const umdBundleSourceResponse = await fetch(url);

  if (umdBundleSourceResponse.status >= 400) {
    throw new Error(
      `Failed to fetch umd bundle at URL ${url} with status ${umdBundleSourceResponse.status}`
    );
  }

  const umdBundleSource = await umdBundleSourceResponse.text();

  return evaluate<T>(umdBundleSource, dependenciesMap);
};
