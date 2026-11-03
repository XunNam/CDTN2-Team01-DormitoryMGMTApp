"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAdmin } from "./admin-context";

export function useResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const { handleError } = useAdmin();
  const [version, setVersion] = useState(0);
  const fullKey = key + ":" + version;
  const [state, setState] = useState<{ key: string; data: T | null; error: unknown }>({ key: "", data: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key: fullKey, data, error: null });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      handleError(error);
      setState({ key: fullKey, data: null, error });
    });
    return () => controller.abort();
  }, [load, fullKey, handleError]);
  return {
    loading: state.key !== fullKey,
    data: state.key === fullKey ? state.data : null,
    error: state.key === fullKey ? state.error : null,
    reload: useCallback(() => setVersion((n) => n + 1), []),
  };
}

export function useTask() {
  const { begin, end } = useAdmin();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const run = useCallback(async <T,>(action: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    if (!begin()) throw new ApiError("REQUEST_IN_PROGRESS");
    const current = new AbortController();
    controller.current = current;
    try {
      const value = await action(current.signal);
      if (current.signal.aborted) throw new ApiError("REQUEST_ABORTED");
      return value;
    } finally { end(); }
  }, [begin, end]);
  return run;
}
