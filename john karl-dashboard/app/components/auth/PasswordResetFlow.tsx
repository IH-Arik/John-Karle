"use client";

import { useState, type FormEvent } from "react";
import {
  getApiErrorMessage,
  useRequestPasswordResetCodeMutation,
  useResetPasswordMutation,
  useVerifyPasswordResetCodeMutation,
} from "../../../lib/api";

type Step = "request" | "verify" | "reset" | "done";

export function PasswordResetFlow({
  initialEmail = "",
  onComplete,
}: {
  initialEmail?: string;
  onComplete?: () => void;
}) {
  const [requestResetCode, { isLoading: isRequesting }] =
    useRequestPasswordResetCodeMutation();
  const [verifyResetCode, { isLoading: isVerifying }] =
    useVerifyPasswordResetCodeMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await requestResetCode({
        email: email.trim().toLowerCase(),
      }).unwrap();
      setEmail(email.trim().toLowerCase());
      setSuccessMessage(response.message);
      setStep("verify");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Reset code could not be sent."));
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await verifyResetCode({
        email,
        code: code.trim(),
      }).unwrap();
      setResetToken(response.resetToken);
      setSuccessMessage(response.message);
      setStep("reset");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Reset code could not be verified."));
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Confirm password must match the new password.");
      return;
    }

    try {
      const response = await resetPassword({
        email,
        resetToken,
        password,
        confirmPassword,
      }).unwrap();
      setSuccessMessage(response.message);
      setStep("done");
      onComplete?.();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Password could not be reset."));
    }
  }

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="space-y-2">
        <h2 className="text-[26px] font-medium leading-tight text-[#334155]">
          {step === "request"
            ? "Reset your password"
            : step === "verify"
              ? "Verify the reset code"
              : step === "reset"
                ? "Choose a new password"
                : "Password reset complete"}
        </h2>
        <p className="text-[15px] leading-7 text-[#526052]">
          {step === "request"
            ? "Enter the email address for the admin account and we will send a 6-digit reset code."
            : step === "verify"
              ? `Enter the code sent to ${email}.`
              : step === "reset"
                ? "Set a new password for the account."
                : "Your password has been updated. You can now sign in with the new credentials."}
        </p>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-[15px] font-semibold text-[#3F4642]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="mt-3 h-11 w-full rounded-md border border-[#AEB4AE] bg-white px-3 text-[14px] font-medium text-[#334155] outline-none transition focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
            />
          </label>
          <FlowFeedback errorMessage={errorMessage} successMessage={successMessage} />
          <button
            type="submit"
            disabled={isRequesting}
            className="h-12 w-full rounded-md bg-[#66785F] text-[18px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRequesting ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-[15px] font-semibold text-[#3F4642]">6-Digit Code</span>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="mt-3 h-11 w-full rounded-md border border-[#AEB4AE] bg-white px-3 text-[14px] font-medium tracking-[0.35em] text-[#334155] outline-none transition focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
            />
          </label>
          <FlowFeedback errorMessage={errorMessage} successMessage={successMessage} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="h-12 flex-1 rounded-md border border-[#AEB4AE] bg-white text-[16px] font-bold text-[#526052] transition hover:bg-[#F7F8F7]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="h-12 flex-1 rounded-md bg-[#66785F] text-[16px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
          />
          <p className="text-[12px] font-medium text-[#6B7280]">
            Minimum 8 characters, with uppercase, lowercase, and a number.
          </p>
          <FlowFeedback errorMessage={errorMessage} successMessage={successMessage} />
          <button
            type="submit"
            disabled={isResetting}
            className="h-12 w-full rounded-md bg-[#66785F] text-[18px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isResetting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="mt-8 space-y-5">
          <FlowFeedback errorMessage={errorMessage} successMessage={successMessage} />
          <button
            type="button"
            onClick={onComplete}
            className="h-12 w-full rounded-md bg-[#66785F] text-[18px] font-bold text-white transition hover:bg-[#596B53]"
          >
            Return to Sign In
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[15px] font-semibold text-[#3F4642]">{label}</span>
      <input
        type="password"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-11 w-full rounded-md border border-[#AEB4AE] bg-white px-3 text-[14px] font-medium text-[#334155] outline-none transition focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
      />
    </label>
  );
}

function FlowFeedback({
  errorMessage,
  successMessage,
}: {
  errorMessage: string;
  successMessage: string;
}) {
  return (
    <>
      {errorMessage ? (
        <p className="rounded border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded border border-[#D7E9DA] bg-[#F5FBF6] px-4 py-3 text-[13px] font-medium text-[#46624E]">
          {successMessage}
        </p>
      ) : null}
    </>
  );
}
