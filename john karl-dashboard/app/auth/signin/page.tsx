"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useLoginMutation, getApiErrorMessage } from "../../../lib/api";
import { setStoredTokens, setStoredUser } from "../../../lib/auth-storage";
import { setSession } from "../../../lib/auth-slice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { PasswordResetFlow } from "../../components/auth/PasswordResetFlow";

export default function SignInPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await login({ email, password }).unwrap();
      setStoredTokens({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      });
      setStoredUser(response.user);
      dispatch(setSession(response.user));
      router.replace("/");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Sign in failed."));
    }
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <main className="grid min-h-screen bg-[#FAFAF7] text-[#263029] lg:grid-cols-[minmax(420px,0.94fr)_minmax(0,1.06fr)]">
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          <Link
            href="/"
            aria-label="Go to dashboard"
            className="inline-flex items-center"
          >
            <Image
              src="/logo.png"
              alt="Lineage.AI"
              width={150}
              height={126}
              priority
              className="h-[104px] w-[124px] object-contain"
            />
          </Link>

          <div className="mt-8">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6F826C]">
              Admin Access
            </p>
            <h1 className="mt-3 text-[34px] font-bold leading-tight text-[#172235] sm:text-[42px]">
              Sign in to Lineage.AI
            </h1>
            <p className="mt-4 text-[15px] font-medium leading-7 text-[#647064]">
              Manage users, billing, reports, AI insights, and platform
              configuration from one secure workspace.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-9 rounded-lg border border-[#E6E6E0] bg-white p-5 shadow-[0_18px_45px_rgba(31,47,40,0.08)] sm:p-7"
          >
            <label className="block">
              <span className="text-[13px] font-bold text-[#334155]">
                Email address
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@lineage.ai"
                className="mt-2 h-12 w-full rounded border border-[#D6DAD4] bg-[#FAFAF7] px-4 text-[14px] font-medium text-[#263029] outline-none transition placeholder:text-[#9BA39B] focus:border-[#46624E] focus:bg-white"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-[13px] font-bold text-[#334155]">
                Password
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter password"
                className="mt-2 h-12 w-full rounded border border-[#D6DAD4] bg-[#FAFAF7] px-4 text-[14px] font-medium text-[#263029] outline-none transition placeholder:text-[#9BA39B] focus:border-[#46624E] focus:bg-white"
              />
            </label>

            <div className="mt-5 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#647064]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#B9C1B8] accent-[#46624E]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-[13px] font-bold text-[#46624E] transition hover:text-[#314936]"
              >
                Forgot password?
              </button>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded border border-[#E9C4C4] bg-[#FFF6F6] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-7 h-12 w-full rounded bg-[#46624E] text-[14px] font-bold text-white transition hover:bg-[#3D5745]"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-[#263029] lg:block">
        <Image
          src="/auth.png"
          alt="Secure dashboard workspace"
          fill
          priority
          sizes="52vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[#263029]/35" />
        <div className="absolute inset-x-12 bottom-12 max-w-[560px] text-white">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#CAEAD5]">
            Secure operations
          </p>
          <h2 className="mt-3 text-[34px] font-bold leading-tight">
            Keep every account, memory, and consent record within reach.
          </h2>
        </div>
      </section>
      {forgotPasswordOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#263029]/45 px-4">
          <section className="w-full max-w-[640px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(31,47,40,0.18)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[28px] font-bold leading-tight text-[#172235]">
                Forgot Password
              </h2>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded text-[#526052] transition hover:bg-[#F2F4EE]"
              >
                Close
              </button>
            </div>
            <div className="mt-6">
              <PasswordResetFlow
                onComplete={() => setForgotPasswordOpen(false)}
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
