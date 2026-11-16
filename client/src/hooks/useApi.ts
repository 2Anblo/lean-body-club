import { useEffect, useState, type DependencyList } from 'react';
import { useData } from '../context/DataContext';

interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

interface Options {
  /** Keep showing the previous result while new inputs load (e.g. while typing a search). */
  keepPrevious?: boolean;
}

/**
 * Fetch data for a screen. Runs again when `deps` change or after any change
 * anywhere in the app (DataContext.refresh()).
 */
export function useApi<T>(fn: () => Promise<T>, deps: DependencyList, options: Options = {}): ApiState<T> {
  const { version } = useData();
  const depsKey = JSON.stringify(deps);
  const [state, setState] = useState<ApiState<T> & { key: string }>({
    key: depsKey,
    data: undefined,
    error: undefined,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    setState((s) =>
      s.key === depsKey || options.keepPrevious
        ? { ...s, key: depsKey, loading: true, error: undefined }
        : { key: depsKey, data: undefined, error: undefined, loading: true },
    );
    fn().then(
      (data) => {
        if (alive) setState({ key: depsKey, data, error: undefined, loading: false });
      },
      (err: unknown) => {
        if (alive) {
          const error = err instanceof Error ? err : new Error(String(err));
          setState((s) => ({ ...s, error, loading: false }));
        }
      },
    );
    return () => {
      alive = false;
    };
    // fn is recreated every render; depsKey and version decide when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, version]);

  return { data: state.data, error: state.error, loading: state.loading };
}
