import { ApiError, createSessionClient, isCancelled, isUncertain, type SessionClient } from "../api/client.ts";
import { readIdentity } from "./contracts.ts";
import type { Identity, LoginInput } from "./types.ts";

export { ApiError as AuthError } from "../api/client.ts";
export function isAuthenticationRequired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && ["AUTH_REQUIRED", "SESSION_EXPIRED"].includes(error.code);
}
function sameAccount(identity: Identity, input: LoginInput): boolean {
  const normalize = (value: string) => input.accountType === "STUDENT" ? value.trim().toUpperCase() : value.trim().toLowerCase();
  return identity.actorKind === input.accountType && normalize(identity.identifier) === normalize(input.identifier);
}

export function createAuthClient(fetcher: typeof fetch = fetch, timeoutMs = 15_000, shared?: SessionClient) {
  const api = shared ?? createSessionClient(fetcher, timeoutMs);
  async function getCurrentIdentity(signal?: AbortSignal): Promise<Identity> {
    return readIdentity((await api.get("auth/me", signal))?.data);
  }
  async function refreshAfterLogin(identity: Identity, signal?: AbortSignal) {
    try { await api.getCsrfToken(signal); return { identity, csrfReady: true }; }
    catch (error) {
      if (isCancelled(error)) throw error;
      return { identity, csrfReady: false };
    }
  }
  async function login(input: LoginInput, signal?: AbortSignal, allowReconciliation = true) {
    let identity: Identity;
    let gotResponse = false;
    try {
      const result = await api.mutate("auth/login", "POST", {
        accountType: input.accountType, identifier: input.identifier.trim(), password: input.password,
      }, signal, true);
      gotResponse = true;
      identity = readIdentity(result?.data);
    } catch (error) {
      if (isCancelled(error)) throw error;
      if (!isUncertain(error) && !(gotResponse && error instanceof ApiError && error.code === "UNEXPECTED_RESPONSE")) throw error;
      if (!allowReconciliation) throw new ApiError("LOGIN_OUTCOME_UNKNOWN");
      try { identity = await getCurrentIdentity(signal); }
      catch (checkError) {
        if (isCancelled(checkError)) throw checkError;
        throw new ApiError("LOGIN_OUTCOME_UNKNOWN");
      }
      if (!sameAccount(identity, input)) throw new ApiError("LOGIN_OUTCOME_UNKNOWN");
    }
    return refreshAfterLogin(identity, signal);
  }
  async function logout(signal?: AbortSignal) {
    try { await api.mutate("auth/logout", "POST", {}, signal, true); }
    catch (error) {
      if (!isUncertain(error) || isCancelled(error)) throw error;
      try { await getCurrentIdentity(signal); }
      catch (checkError) {
        if (isAuthenticationRequired(checkError)) return;
        if (isCancelled(checkError)) throw checkError;
      }
      throw new ApiError("LOGOUT_OUTCOME_UNKNOWN");
    }
  }
  async function changePassword(input: { currentPassword: string; newPassword: string }, signal?: AbortSignal) {
    try {
      await api.mutate("auth/change-password", "POST", {
        currentPassword: input.currentPassword, newPassword: input.newPassword,
      }, signal, true);
    } catch (error) {
      if (isCancelled(error)) throw error;
      if (isUncertain(error) || (error instanceof ApiError && ["SERVICE_UNAVAILABLE", "INTERNAL_ERROR"].includes(error.code))) {
        throw new ApiError("PASSWORD_OUTCOME_UNKNOWN");
      }
      throw error;
    }
    try { await api.getCsrfToken(signal); return { csrfReady: true }; }
    catch (error) {
      if (isCancelled(error)) throw error;
      return { csrfReady: false };
    }
  }
  return { getCurrentIdentity, getCsrfToken: api.getCsrfToken, login, logout, changePassword };
}
