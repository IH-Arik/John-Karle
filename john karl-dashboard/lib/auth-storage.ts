import type { PublicUser } from "./types";

const ACCESS_TOKEN_KEY = "johnkarle.accessToken";
const REFRESH_TOKEN_KEY = "johnkarle.refreshToken";
const SESSION_USER_KEY = "johnkarle.sessionUser";

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getStoredTokens(): StoredAuthTokens | null {
  if (!canUseStorage()) {
    return null;
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export function setStoredTokens(tokens: StoredAuthTokens) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getStoredUser(): PublicUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(SESSION_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as PublicUser;
  } catch {
    window.localStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export function setStoredUser(user: PublicUser) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_USER_KEY);
}

export function clearStoredTokens() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
