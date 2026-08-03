import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseAsyncReturn<T, Args extends any[]> extends AsyncState<T> {
  run: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * A custom hook to gracefully manage asynchronous operations (like API calls)
 * and expose standardized loading, error, and data states.
 */
export function useAsync<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const run = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, isLoading: true, error: null });

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, isLoading: false, error: null });
        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Something went wrong. Please try again.';
        setState({ data: null, isLoading: false, error: errorMessage });
        return null;
      }
    },
    [asyncFunction]
  );

  return {
    ...state,
    run,
    reset,
    setData,
  };
}

export default useAsync;
