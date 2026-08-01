"use client";

import type { ReactNode } from "react";
import { useEffect, useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  getApiErrorMessage,
  useGetAdminSettingsQuery,
  useUpdateAdminPasswordMutation,
  useUpdateAdminSettingsMutation,
} from "../../../lib/api";
import { PasswordResetFlow } from "../auth/PasswordResetFlow";

type SettingsPage =
  | "list"
  | "change-password"
  | "forgot-password"
  | "privacy"
  | "terms"
  | "about";

const settingsItems: { label: string; page: SettingsPage }[] = [
  { label: "Change Password", page: "change-password" },
  { label: "Privacy Policy", page: "privacy" },
  { label: "Terms & Conditions", page: "terms" },
  { label: "About Us", page: "about" },
];

export function SettingsContent() {
  const [page, setPage] = useState<SettingsPage>("list");

  if (page === "change-password") {
    return (
      <SettingsShell title="Change Password" onBack={() => setPage("list")}>
        <ChangePasswordForm onForgot={() => setPage("forgot-password")} />
      </SettingsShell>
    );
  }

  if (page === "forgot-password") {
    return (
      <SettingsShell title="Forgot Password" onBack={() => setPage("change-password")}>
        <PasswordResetFlow />
      </SettingsShell>
    );
  }

  if (page === "privacy" || page === "terms" || page === "about") {
    const title =
      page === "privacy"
        ? "Privacy Policy"
        : page === "terms"
          ? "Terms & Conditions"
          : "About Us";

    return (
      <SettingsShell title={title} onBack={() => setPage("list")}>
        <LegalEditor page={page} />
      </SettingsShell>
    );
  }

  return (
    <section className="w-full">
      <div className="min-h-[620px] overflow-hidden rounded-lg border border-[#E2E6DF] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
        <header className="bg-[#66785F] px-5 py-5 sm:px-7">
          <h1 className="text-[30px] font-bold leading-tight text-white sm:text-[34px]">
            Settings
          </h1>
        </header>
        <div className="px-5 sm:px-7">
          {settingsItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setPage(item.page)}
              className="flex min-h-[58px] w-full items-center justify-between border-b border-[#BFC6BC] text-left text-[18px] font-medium text-[#263029] transition hover:bg-[#F7F9F7]"
            >
              <span>{item.label}</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                strokeWidth={1.8}
                className="text-[#263029]"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="min-h-[620px] overflow-hidden rounded-lg border border-[#E2E6DF] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
        <header className="flex min-h-[66px] items-center justify-between gap-4 bg-[#66785F] px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to settings"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white transition hover:bg-white/10"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                strokeWidth={1.8}
              />
            </button>
            <h1 className="truncate text-[28px] font-bold leading-tight text-white sm:text-[34px]">
              {title}
            </h1>
          </div>
        </header>
        <div className="px-5 py-8 sm:px-8 lg:px-14">{children}</div>
      </div>
    </section>
  );
}

function ChangePasswordForm({ onForgot }: { onForgot: () => void }) {
  const [updatePassword, { isLoading }] = useUpdateAdminPasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Confirm password must match the new password.");
      return;
    }

    try {
      const response = await updatePassword({
        currentPassword,
        newPassword,
      }).unwrap();
      setSuccessMessage(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Password could not be changed."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[620px] space-y-5">
      <PasswordField
        label="Current Password"
        placeholder="Enter current password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />
      <PasswordField
        label="New Password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={setNewPassword}
      />
      <PasswordField
        label="Confirm New Password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgot}
          className="text-[12px] font-semibold text-[#66785F] underline"
        >
          Forgot password?
        </button>
      </div>
      <p className="text-[12px] font-medium text-[#6B7280]">
        Minimum 8 characters, with uppercase, lowercase, and a number.
      </p>
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
      <button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-md bg-[#66785F] text-[18px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-[20px] font-medium text-[#334155]">{label}</span>
      <span className="relative mt-2 block">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          className="h-11 w-full rounded border border-[#9EA79C] px-3 pr-12 text-[14px] outline-none transition focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#8A928B] transition hover:bg-[#F2F4EE]"
        >
          <HugeiconsIcon
            icon={visible ? ViewOffSlashIcon : ViewIcon}
            size={18}
            strokeWidth={1.8}
          />
        </button>
      </span>
    </label>
  );
}

function LegalEditor({ page }: { page: "privacy" | "terms" | "about" }) {
  const { data, isLoading, error } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAdminSettingsMutation();
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!data?.settings) {
      return;
    }

    setValue(
      page === "privacy"
        ? data.settings.privacyPolicy ?? ""
        : page === "terms"
          ? data.settings.termsAndConditions ?? ""
          : data.settings.aboutUs ?? "",
    );
  }, [data, page]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmed = value.trim();

    if (!trimmed) {
      setErrorMessage("This settings field cannot be empty.");
      return;
    }

    try {
      await updateSettings(
        page === "privacy"
          ? { privacyPolicy: trimmed }
          : page === "terms"
            ? { termsAndConditions: trimmed }
            : { aboutUs: trimmed },
      ).unwrap();
      setSuccessMessage("Settings updated successfully.");
    } catch (saveError) {
      setErrorMessage(getApiErrorMessage(saveError, "Settings could not be updated."));
    }
  }

  if (isLoading) {
    return <p className="text-[14px] font-medium text-[#526052]">Loading settings...</p>;
  }

  if (error) {
    return (
      <p className="rounded border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
        {getApiErrorMessage(error, "Settings could not be loaded.")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-[360px] w-full rounded-lg border border-[#D8DDD6] bg-white px-5 py-4 text-[14px] leading-7 text-[#334155] outline-none transition focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
      />

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

      <button
        type="submit"
        disabled={isSaving}
        className="h-11 rounded bg-[#66785F] px-8 text-[13px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
