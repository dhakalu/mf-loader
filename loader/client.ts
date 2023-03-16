export type RemoteConfig = {
  url: string;
  tinyFrontendName: string;
  dependenciesMap: Record<string, unknown>;
};

export const clientLoader = async <T>({
  url,
  tinyFrontendName,
  dependenciesMap,
}: RemoteConfig): Promise<T> => {
  const script = document.createElement('script');
  script.src = url;

  const loadPromise = new Promise<T>((resolve, reject) => {
    script.addEventListener('load', () => {
      resolve(
        (window.tinyFrontendExports as Record<string, T>)[tinyFrontendName]
      );
    });
    script.addEventListener('error', (event) => {
      try {
        document.head.removeChild(script);
      } finally {
        reject(event.error);
      }
    });
  });

  window.tinyFrontendDeps = {
    ...window.tinyFrontendDeps,
    ...dependenciesMap,
  };

  document.head.appendChild(script);

  return loadPromise;
};
