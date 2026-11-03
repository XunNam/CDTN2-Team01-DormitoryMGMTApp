import type { FieldIssue } from "../auth/types.ts";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: FieldIssue[];
  readonly ambiguous: boolean;

  constructor(code: string, status = 0, details: FieldIssue[] = [], ambiguous = false) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.ambiguous = ambiguous;
  }
}

export interface Envelope { data: unknown; meta?: unknown }
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function isCancelled(error: unknown): boolean {
  return error instanceof ApiError && ["REQUEST_ABORTED", "REQUEST_IN_PROGRESS"].includes(error.code);
}
export function isUncertain(error: unknown): boolean {
  return error instanceof ApiError && error.ambiguous;
}

export function createSessionClient(fetcher: typeof fetch = fetch, timeoutMs = 15_000) {
  let csrf: string | null = null;
  async function request(path: string, method: "GET" | "POST" | "PATCH", body?: object, signal?: AbortSignal, token?: string): Promise<Envelope | null> {
    if (signal?.aborted) throw new ApiError("REQUEST_ABORTED");
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const mutation = method !== "GET";
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (mutation) headers["Content-Type"] = "application/json";
      if (token) headers["X-CSRF-Token"] = token;
      const response = await fetcher("/api/v1/" + path, {
        method, headers, signal: controller.signal, credentials: "same-origin", cache: "no-store",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (response.ok && response.status === 204) return null;
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
        const code = error && typeof error.code === "string" ? error.code
          : response.status >= 500 ? "SERVICE_UNAVAILABLE" : "UNEXPECTED_RESPONSE";
        const details: FieldIssue[] = [];
        if (error && Array.isArray(error.details)) {
          for (const detail of error.details) {
            if (isRecord(detail) && typeof detail.field === "string" && typeof detail.message === "string") {
              details.push({ field: detail.field, message: detail.message });
            }
          }
        }
        if (code === "CSRF_INVALID") csrf = null;
        // A proxy error may arrive after an upstream write committed.
        throw new ApiError(code, response.status, details, mutation && !error && response.status >= 500);
      }
      if (!isRecord(payload) || !("data" in payload)) throw new ApiError("UNEXPECTED_RESPONSE", response.status, [], mutation);
      return { data: payload.data, ...(payload.meta !== undefined ? { meta: payload.meta } : {}) };
    } catch (error) {
      if (signal?.aborted) throw new ApiError("REQUEST_ABORTED", 0, [], mutation);
      if (timedOut) throw new ApiError("REQUEST_TIMEOUT", 0, [], mutation);
      if (error instanceof ApiError) throw error;
      throw new ApiError("NETWORK_ERROR", 0, [], mutation);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
  async function get(path: string, signal?: AbortSignal) { return request(path, "GET", undefined, signal); }
  async function getCsrfToken(signal?: AbortSignal): Promise<string> {
    csrf = null;
    const result = await get("auth/csrf", signal);
    if (!isRecord(result?.data) || typeof result.data.csrfToken !== "string" || !/^[a-f0-9]{64}$/.test(result.data.csrfToken)) {
      throw new ApiError("UNEXPECTED_RESPONSE");
    }
    csrf = result.data.csrfToken;
    return csrf;
  }
  async function mutate(path: string, method: "POST" | "PATCH", body: object, signal?: AbortSignal, rotatesSession = false) {
    const token = csrf ?? await getCsrfToken(signal);
    if (rotatesSession) csrf = null;
    return request(path, method, body, signal, token);
  }
  return { get, mutate, getCsrfToken, clearCsrf: () => { csrf = null; } };
}
export type SessionClient = ReturnType<typeof createSessionClient>;
