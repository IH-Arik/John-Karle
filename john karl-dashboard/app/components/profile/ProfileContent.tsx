"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  ImageUploadIcon,
  UserCircleIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  getApiErrorMessage,
  useGetAdminProfileQuery,
  useUpdateAdminPasswordMutation,
  useUpdateAdminProfileMutation,
} from "../../../lib/api";
import { setStoredUser } from "../../../lib/auth-storage";

type ProfileTab = "profile" | "password";

export function ProfileContent() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageMessage, setProfileImageMessage] = useState("");
  const [profileImageError, setProfileImageError] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useGetAdminProfileQuery();
  const user = data?.user;

  useEffect(() => {
    setProfileImage(user?.profilePicture?.url ?? null);
    setProfileImageFile(null);
    setProfileImageMessage(
      user?.profilePicture?.url
        ? "Click the avatar to replace your photo."
        : "Click to upload a profile photo.",
    );
    setProfileImageError(false);
  }, [user?.profilePicture?.url]);

  useEffect(() => {
    if (!profileImage?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(profileImage);
    };
  }, [profileImage]);

  if (isLoading) {
    return (
      <section className="w-full rounded-lg border border-[#E2E6DF] bg-white px-6 py-8 shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
        <p className="text-[14px] font-medium text-[#626A64]">Loading profile...</p>
      </section>
    );
  }

  if (error || !data?.user) {
    return (
      <section className="w-full rounded-lg border border-[#E7D7D7] bg-[#FFF8F8] px-6 py-8 shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
        <p className="text-[14px] font-medium text-[#A63C3C]">
          {getApiErrorMessage(error, "Profile could not be loaded.")}
        </p>
      </section>
    );
  }

  const currentUser = data.user;

  function uploadProfileImage(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileImageMessage("Please choose a valid image file.");
      setProfileImageError(true);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileImageMessage("Image must be 2MB or smaller.");
      setProfileImageError(true);
      return;
    }

    setProfileImage(URL.createObjectURL(file));
    setProfileImageFile(file);
    setProfileImageMessage(file.name);
    setProfileImageError(false);
  }

  function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    uploadProfileImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleProfileImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    uploadProfileImage(event.dataTransfer.files?.[0]);
  }

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-lg border border-[#E2E6DF] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
        <header className="bg-[#66785F] px-5 py-5 sm:px-7">
          <h1 className="text-[30px] font-bold leading-tight text-white sm:text-[34px]">
            Profile
          </h1>
        </header>

        <div className="px-5 pb-12 pt-8 sm:px-8">
          <section className="flex flex-col items-center border-b border-[#F0F1EF] pb-7">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleProfileImageDrop}
              className="group relative rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-[#66785F]/20"
            >
              <span
                className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 bg-[#E6EEE7] text-[#66785F] shadow-[0_18px_45px_rgba(31,47,40,0.12)] transition ${
                  profileImageError
                    ? "border-[#E7B9B9]"
                    : "border-white group-hover:border-[#DDE6DA]"
                }`}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={76}
                    strokeWidth={1.35}
                  />
                )}
              </span>
              <span className="absolute inset-0 rounded-full bg-[#172235]/0 transition group-hover:bg-[#172235]/10" />
              <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#66785F] text-white shadow-lg transition group-hover:scale-105">
                <HugeiconsIcon icon={Edit02Icon} size={18} strokeWidth={1.8} />
              </span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleProfileImageChange}
            />
            <h2 className="mt-4 text-center text-[30px] font-bold text-[#2D384B]">
              {currentUser.name}
            </h2>
            <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-[#8B918B]">
              {currentUser.role.replace("_", " ")}
            </p>
            <p
              className={`mt-3 text-center text-[12px] font-medium ${
                profileImageError ? "text-[#B44444]" : "text-[#66785F]"
              }`}
            >
              {profileImageMessage}
            </p>
          </section>

          <div className="mt-5 flex justify-center gap-8 text-[13px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`border-b-2 pb-1 transition ${
                activeTab === "profile"
                  ? "border-[#66785F] text-[#66785F]"
                  : "border-transparent text-[#8B918B] hover:text-[#66785F]"
              }`}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`border-b-2 pb-1 transition ${
                activeTab === "password"
                  ? "border-[#66785F] text-[#66785F]"
                  : "border-transparent text-[#8B918B] hover:text-[#66785F]"
              }`}
            >
              Change Password
            </button>
          </div>

          <div className="mx-auto mt-8 max-w-[520px]">
            {activeTab === "profile" ? (
              <ProfileForm
                key={currentUser.updatedAt}
                name={currentUser.name}
                email={currentUser.email}
                phone={currentUser.phoneNumber ?? ""}
                address={currentUser.address ?? ""}
                profileImage={profileImage}
                profileImageFile={profileImageFile}
                onProfileImageSaved={(nextImage) => {
                  setProfileImage(nextImage);
                  setProfileImageFile(null);
                  setProfileImageMessage(
                    nextImage ? "Click the avatar to replace your photo." : "Click to upload a profile photo.",
                  );
                  setProfileImageError(false);
                }}
              />
            ) : (
              <PasswordForm />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileForm({
  name,
  email,
  phone,
  address,
  profileImage,
  profileImageFile,
  onProfileImageSaved,
}: {
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string | null;
  profileImageFile: File | null;
  onProfileImageSaved: (value: string | null) => void;
}) {
  const [updateProfile, { isLoading }] = useUpdateAdminProfileMutation();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = new FormData();
    const nameValue = String(formData.get("name") ?? "").trim();
    const phoneValue = String(formData.get("phone") ?? "").trim();
    const addressValue = String(formData.get("address") ?? "").trim();

    payload.append("name", nameValue);

    if (phoneValue) {
      payload.append("phone", phoneValue);
    }

    if (addressValue) {
      payload.append("address", addressValue);
    }

    if (profileImageFile) {
      payload.append("profileImage", profileImageFile);
    }

    try {
      const response = await updateProfile(payload).unwrap();
      setStoredUser(response.user);
      onProfileImageSaved(response.user.profilePicture?.url ?? profileImage ?? null);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Profile could not be updated."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileField label="User Name" name="name" defaultValue={name} />
      <ProfileField label="Email" defaultValue={email} disabled />
      <ProfileField label="Contact No" name="phone" defaultValue={phone} />
      <ProfileField label="Address" name="address" defaultValue={address} />

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
        className="h-12 w-full rounded-md bg-[#66785F] text-[15px] font-bold text-white shadow-[0_4px_8px_rgba(31,47,40,0.16)] transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Updating..." : "Update Profile"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [updatePassword, { isLoading }] = useUpdateAdminPasswordMutation();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      setErrorMessage(getApiErrorMessage(error, "Password could not be updated."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfilePasswordField
        label="Current Password"
        placeholder="Enter current password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />
      <ProfilePasswordField
        label="New Password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={setNewPassword}
      />
      <ProfilePasswordField
        label="Confirm Password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

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
        className="h-12 w-full rounded-md bg-[#66785F] text-[15px] font-bold text-white shadow-[0_4px_8px_rgba(31,47,40,0.16)] transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

function ProfilePasswordField({
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
      <span className="text-[15px] font-bold text-[#334155]">{label}</span>
      <span className="relative mt-2 block">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          className="h-11 w-full border border-[#AEB4AE] bg-white px-4 pr-12 text-[14px] font-medium text-[#334155] outline-none transition placeholder:text-[#9DA49E] focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#66785F] transition hover:bg-[#F2F4EE]"
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

function ProfileField({
  label,
  defaultValue,
  name,
  type = "text",
  disabled = false,
}: {
  label: string;
  defaultValue: string;
  name?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[15px] font-bold text-[#334155]">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        type={type}
        disabled={disabled}
        className="mt-2 h-11 w-full border border-[#AEB4AE] bg-white px-4 text-[14px] font-medium text-[#334155] outline-none transition disabled:bg-[#F3F4F2] disabled:text-[#7F8A82] focus:border-[#66785F] focus:ring-2 focus:ring-[#66785F]/15"
      />
    </label>
  );
}
