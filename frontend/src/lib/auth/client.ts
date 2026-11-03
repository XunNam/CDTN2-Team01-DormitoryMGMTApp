import type { FieldIssue, Identity, LoginInput } from "./types.ts";

export class AuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: FieldIssue[];

  constructor(code: string, status = 0, details: FieldIssue[] = []) {
    // Never copy request bodies, credentials, or untrusted backend messages to errors.
    super(code);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type Fetcher = typeof fetch;
type RequestOptions = {
  method?: "GET" | "POST";
  body?: object;
  csrfToken?: string;
  signal?: AbortSignal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIdentity(data: unknown): Identity {
  if (!isRecord(data)) throw new AuthError("UNEXPECTED_RESPONSE");
  const validKind = data.actorKind === "STUDENT" || data.actorKind === "STAFF";
  const validRole = data.actorKind === "STUDENT"
    ? data.role === "SV"
    : data.role === "BQL" || data.role === "ADMIN";
  const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (!validKind || !validRole
    || typeof data.accountId !== "string" || !uuid.test(data.accountId)
    || typeof data.identifier !== "string" || !data.identifier
    || typeof data.displayName !== "string" || !data.displayName
    || (data.actorKind === "STUDENT"
      ? typeof data.studentId !== "string" || !uuid.test(data.studentId)
      : data.studentId !== null)) {
    throw new AuthError("UNEXPECTED_RESPONSE");
  }
  return {
    actorKind: data.actorKind as Identity["actorKind"],
    accountId: data.accountId,
    role: data.role as Identity["role"],
    identifier: data.identifier,
    displayName: data.displayName,
    studentId: data.studentId as string | null,
  };
}

export function isAuthenticationRequired(error: unknown): boolean {
  return error instanceof AuthError && error.status === 401
    && ["AUTH_REQUIRED", "SESSION_EXPIRED"].includes(error.code);
}

function wasInterrupted(error: unknown): boolean {
  return error instanceof AuthError
    && (["NETWORK_ERROR", "REQUEST_TIMEOUT"].includes(error.code)
      || (error.code === "UNEXPECTED_RESPONSE" && (error.status === 0 || (error.status >= 200 && error.status < 300))));
}

function sameAccount(identity: Identity, input: LoginInput): boolean {
  const normalize = (value: string) => input.accountType === "STUDENT"
    ? value.trim().toUpperCase() : value.trim().toLowerCase();
  return identity.actorKind === input.accountType
    && normalize(identity.identifier) === normalize(input.identifier);
}

/** Each mounted login screen owns its CSRF token in memory; no browser persistence. */
export function createAuthClient(fetcher: Fetcher = fetch, timeoutMs = 15_000) {
  let csrfToken: string | null = null;

  async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (options.method === "POST") headers["Content-Type"] = "application/json";
      if (options.csrfToken) headers["X-CSRF-Token"] = options.csrfToken;
      const response = await fetcher("/api/v1/auth/" + path, {
        method: options.method ?? "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers,
        signal: controller.signal,
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });
      if (response.status === 204 && response.ok) return undefined;
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        const apiError = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
        const code = apiError && typeof apiError.code === "string"
          ? apiError.code
          : response.status >= 500 ? "SERVICE_UNAVAILABLE" : "UNEXPECTED_RESPONSE";
        const details: FieldIssue[] = [];
        if (apiError && Array.isArray(apiError.details)) {
          for (const detail of apiError.details) {
            if (isRecord(detail) && typeof detail.field === "string" && typeof detail.message === "string") {
              details.push({ field: detail.field, message: detail.message });
            }
          }
        }
        throw new AuthError(code, response.status, details);
      }
      if (!isRecord(payload) || !("data" in payload)) {
        throw new AuthError("UNEXPECTED_RESPONSE", response.status);
      }
      return payload.data;
    } catch (error) {
      if (options.signal?.aborted) throw new AuthError("REQUEST_ABORTED");
      if (timedOut) throw new AuthError("REQUEST_TIMEOUT");
      if (error instanceof AuthError) throw error;
      throw new AuthError("NETWORK_ERROR");
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  async function getCurrentIdentity(signal?: AbortSignal): Promise<Identity> {
    return readIdentity(await request("me", { signal }));
  }

  async function getCsrfToken(signal?: AbortSignal): Promise<string> {
    csrfToken = null;
    const data = await request("csrf", { signal });
    if (!isRecord(data) || typeof data.csrfToken !== "string"
      || !/^[a-f0-9]{64}$/.test(data.csrfToken)) {
      throw new AuthError("UNEXPECTED_RESPONSE");
    }
    csrfToken = data.csrfToken;
    return csrfToken;
  }

  async function refreshAfterLogin(identity: Identity, signal?: AbortSignal) {
    try {
      await getCsrfToken(signal);
      return { identity, csrfReady: true };
    } catch (error) {
      if (error instanceof AuthError && error.code === "REQUEST_ABORTED") throw error;
      // A failed CSRF refresh must never turn a successful login into a failure.
      return { identity, csrfReady: false };
    }
  }

  async function login(input: LoginInput, signal?: AbortSignal) {
    const token = csrfToken ?? await getCsrfToken(signal);
    // Login rotates the session; the previous token must not be used again.
    csrfToken = null;
    let identity: Identity;
    try {
      identity = readIdentity(await request("login", {
        method: "POST",
        csrfToken: token,
        signal,
        body: {
          accountType: input.accountType,
          identifier: input.identifier.trim(),
          password: input.password,
        },
      }));
    } catch (error) {
      if (!wasInterrupted(error)) throw error;
      // The POST may have committed even when its response was lost. Never replay it.
      try {
        identity = await getCurrentIdentity(signal);
      } catch (checkError) {
        if (checkError instanceof AuthError && checkError.code === "REQUEST_ABORTED") throw checkError;
        throw new AuthError("LOGIN_OUTCOME_UNKNOWN");
      }
      if (!sameAccount(identity, input)) throw new AuthError("LOGIN_OUTCOME_UNKNOWN");
    }
    return refreshAfterLogin(identity, signal);
  }

  async function logout(signal?: AbortSignal) {
    const token = csrfToken ?? await getCsrfToken(signal);
    csrfToken = null;
    try {
      await request("logout", { method: "POST", body: {}, csrfToken: token, signal });
    } catch (error) {
      if (!wasInterrupted(error)) throw error;
      try {
        await getCurrentIdentity(signal);
      } catch (checkError) {
        if (isAuthenticationRequired(checkError)) return;
        if (checkError instanceof AuthError && checkError.code === "REQUEST_ABORTED") throw checkError;
      }
      throw new AuthError("LOGOUT_OUTCOME_UNKNOWN");
    }
  }

  return { getCurrentIdentity, getCsrfToken, login, logout };
}

