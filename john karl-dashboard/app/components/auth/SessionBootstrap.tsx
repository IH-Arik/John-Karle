"use client";

import { useEffect } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useMeQuery } from "../../../lib/api";
import {
  clearStoredTokens,
  clearStoredUser,
  getStoredTokens,
  getStoredUser,
  setStoredUser,
} from "../../../lib/auth-storage";
import { clearSession, markInitialized, setSession } from "../../../lib/auth-slice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";

export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const storedTokens = getStoredTokens();
  const storedUser = getStoredUser();
  const hasStoredTokens = !!storedTokens;
  const { data, error, isLoading } = useMeQuery(undefined, {
    skip: !hasStoredTokens,
  });

  useEffect(() => {
    if (!isInitialized) {
      if (hasStoredTokens && storedUser) {
        dispatch(setSession(storedUser));
        return;
      }

      if (!hasStoredTokens && !isLoading) {
        clearStoredUser();
        dispatch(markInitialized());
        return;
      }
    }

    if (data?.user) {
      setStoredUser(data.user);
      dispatch(setSession(data.user));
      return;
    }

    if (error) {
      const status = (error as FetchBaseQueryError).status;
      const isUnauthorized = status === 401 || status === 403;

      if (isUnauthorized) {
        clearStoredTokens();
        clearStoredUser();
        dispatch(clearSession());
        return;
      }

      if (!isInitialized) {
        if (storedUser) {
          dispatch(setSession(storedUser));
          return;
        }

        dispatch(markInitialized());
      }
      return;
    }

    if (!hasStoredTokens && !isInitialized && !isLoading) {
      clearStoredUser();
      dispatch(markInitialized());
    }
  }, [data, dispatch, error, hasStoredTokens, isInitialized, isLoading, storedUser]);

  return null;
}
