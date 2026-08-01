"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  Cancel01Icon,
  Image01Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  MailSend01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import {
  getApiErrorMessage,
  useGetAdminEmailTemplateByIdQuery,
  useGetAdminEmailTemplatesQuery,
  useGetAdminUsersQuery,
  useSendBulkEmailMutation,
} from "../../../lib/api";
import type { AdminEmailTemplate, PublicUser } from "../../../lib/types";

type AttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export function BulkEmailContent() {
  const { data, isLoading } = useGetAdminUsersQuery({ page: 1, limit: 50 });
  const {
    data: emailTemplatesData,
    isLoading: isTemplatesLoading,
  } = useGetAdminEmailTemplatesQuery({ page: 1, limit: 100 });
  const [sendBulkEmail, { isLoading: isSending }] = useSendBulkEmailMutation();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState("Exciting New Updates to Your Workspace");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([
    {
      id: "release-notes",
      name: "release_notes_v2.pdf",
      size: 1024 * 1024,
      type: "application/pdf",
    },
  ]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const audience = data?.users ?? [];
  const emailTemplates = emailTemplatesData?.templates ?? [];
  const { data: selectedTemplateData } = useGetAdminEmailTemplateByIdQuery(
    selectedTemplateId,
    { skip: !selectedTemplateId },
  );

  const filteredAudience = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return audience;
    }

    return audience.filter((person) => {
      const phone = person.phoneNumber?.toLowerCase() ?? "";

      return (
        person.name.toLowerCase().includes(normalized) ||
        person.email.toLowerCase().includes(normalized) ||
        phone.includes(normalized)
      );
    });
  }, [audience, query]);

  const selectedRecipients = audience.filter((person) =>
    selectedIds.includes(person.id),
  );
  const allRecipientsSelected =
    audience.length > 0 && audience.every((person) => selectedIds.includes(person.id));

  useEffect(() => {
    if (!emailTemplates.length || selectedTemplateId) {
      return;
    }

    setSelectedTemplateId(emailTemplates[0].id);
  }, [emailTemplates, selectedTemplateId]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.innerHTML = toEditorHtml(
      `Hi there,

We have important platform updates to share with your workspace.
Please review the latest dashboard notices and contact the admin team if you need support.

Best regards,
The Lineage Team`,
    );
  }, []);

  useEffect(() => {
    const template = selectedTemplateData?.template;

    if (!template || !editorRef.current) {
      return;
    }

    setSubject(template.subjectLine);
    editorRef.current.innerHTML = toEditorHtml(template.content);
  }, [selectedTemplateData]);

  function toggleRecipient(id: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id],
    );
  }

  function toggleAllRecipients() {
    setSelectedIds(allRecipientsSelected ? [] : audience.map((person) => person.id));
  }

  function runEditorCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function addLink() {
    const url = window.prompt("Paste a link URL");

    if (url) {
      runEditorCommand("createLink", url);
    }
  }

  function addImage() {
    imageInputRef.current?.click();
  }

  function insertLocalImage(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        runEditorCommand("insertImage", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function addAttachments(files: FileList | File[]) {
    const nextFiles = Array.from(files).map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setAttachments((currentFiles) => [...currentFiles, ...nextFiles]);
  }

  function removeAttachment(id: string) {
    setAttachments((currentFiles) =>
      currentFiles.filter((file) => file.id !== id),
    );
  }

  async function handleSendEmail() {
    setErrorMessage("");
    setSuccessMessage("");

    const message = editorRef.current?.innerText.trim() ?? "";

    if (selectedIds.length === 0) {
      setErrorMessage("Select at least one recipient before sending.");
      return;
    }

    if (selectedIds.length > 50) {
      setErrorMessage("You can send bulk email to at most 50 users at a time.");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("Email subject is required.");
      return;
    }

    if (!message) {
      setErrorMessage("Email message is required.");
      return;
    }

    try {
      const response = await sendBulkEmail({
        userIds: selectedIds,
        subject: subject.trim(),
        message,
      }).unwrap();

      setSuccessMessage(
        `Bulk email sent to ${response.sentCount} recipient${response.sentCount === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Bulk email could not be sent."));
    }
  }

  return (
    <section className="grid w-full grid-cols-1 gap-6 font-[Inter,Arial,sans-serif] xl:grid-cols-[minmax(360px,0.86fr)_1.22fr]">
      <section className="overflow-hidden rounded-lg border border-[#E8EAE8] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
        <div className="px-5 py-5">
          <h1 className="text-[18px] font-semibold leading-6 text-[#191C1F]">
            Target Audience
          </h1>
          <label className="relative mt-4 block">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={1.8}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users by name, email, or phone"
              className="h-11 w-full rounded-lg border border-[#E2E6EA] bg-[#F8FAFD] pl-11 pr-4 text-[14px] font-normal leading-[17px] text-[#334155] outline-none transition placeholder:text-[#6B7280] focus:border-[#66785F] focus:bg-white"
            />
          </label>
        </div>

        <div className="overflow-x-auto border-t border-[#EFF0EC]">
          <table className="w-full min-w-[520px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[48px]" />
              <col className="w-[34%]" />
              <col className="w-[42%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="bg-[#FBFCFE]">
              <tr className="text-[12px] font-bold uppercase leading-4 tracking-[0.6px] text-[#94A3B8]">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allRecipientsSelected}
                    onChange={toggleAllRecipients}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-[#CBD4CE] accent-[#66785F]"
                    aria-label="Select all recipients"
                  />
                </th>
                <th className="px-3 py-4">Name</th>
                <th className="px-3 py-4">Email</th>
                <th className="px-3 py-4 text-center">Role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[14px] font-medium text-[#94A3B8]"
                  >
                    Loading recipients...
                  </td>
                </tr>
              ) : filteredAudience.map((person) => {
                const selected = selectedIds.includes(person.id);

                return (
                  <tr
                    key={person.id}
                    className="border-t border-[#EFF0EC] text-[16px] font-normal leading-[19px] text-[#334155] transition hover:bg-[#F7F9F7]"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRecipient(person.id)}
                        className="h-4 w-4 rounded border-[#CBD4CE] accent-[#66785F]"
                        aria-label={`Select ${person.name}`}
                      />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <span className="block leading-[19px]">{person.name}</span>
                    </td>
                    <td className="px-3 py-4 align-middle text-[#64748B]">
                      <span className="block break-all leading-[19px]">
                        {person.email}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      <StatusPill user={person} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[#E8EAE8] bg-white p-5 shadow-[0_12px_30px_rgba(31,47,40,0.06)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="max-w-[190px] text-[18px] font-semibold leading-6 text-[#191C1F]">
            Compose Campaign
          </h1>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSending || isLoading}
            className="flex h-11 items-center justify-center gap-3 rounded-lg bg-[#66785F] px-8 text-[16px] font-normal leading-6 text-white shadow-[0_5px_14px_rgba(31,47,40,0.18)] transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <HugeiconsIcon icon={MailSend01Icon} size={18} strokeWidth={1.8} />
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <p className="text-[14px] font-normal leading-5 text-[#475569]">
              Recipients ({selectedRecipients.length} selected)
            </p>
            <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-[#E2E6EA] bg-[#F8FAFD] px-3 py-2">
              {selectedRecipients.length > 0 ? (
                selectedRecipients.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleRecipient(person.id)}
                    className="inline-flex min-h-7 items-center gap-2 rounded-md border border-[#DDE3EA] bg-white px-3 text-[12px] font-medium leading-4 text-[#334155] transition hover:border-[#66785F]"
                  >
                    {person.name}
                    <span className="text-[#94A3B8]">x</span>
                  </button>
                ))
              ) : (
                <span className="text-[14px] font-normal text-[#94A3B8]">
                  Select recipients from the audience table.
                </span>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-[14px] font-normal leading-5 text-[#475569]">
              Email Template
            </span>
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              disabled={isTemplatesLoading || emailTemplates.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-[#E2E6EA] bg-[#F8FAFD] px-4 text-[14px] font-normal leading-5 text-[#191C1F] outline-none transition focus:border-[#66785F] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {emailTemplates.length === 0 ? (
                <option value="">No templates available</option>
              ) : (
                emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateName}
                  </option>
                ))
              )}
            </select>
            {selectedTemplateId && selectedTemplateData?.template ? (
              <p className="mt-2 text-[12px] font-medium text-[#7B827B]">
                Using template: {selectedTemplateData.template.templateName}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-[14px] font-normal leading-5 text-[#475569]">
              Email Subject
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-[#E2E6EA] bg-[#F8FAFD] px-4 text-[14px] font-semibold leading-5 text-[#1E293B] outline-none transition focus:border-[#66785F] focus:bg-white"
            />
          </label>

          <div>
            <p className="text-[14px] font-normal leading-5 text-[#475569]">
              Email Body
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-[#E2E6EA] bg-white">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E6EA] bg-[#FBFCFE] px-3 py-2">
                <ToolbarButton label="Bold" onClick={() => runEditorCommand("bold")}>
                  B
                </ToolbarButton>
                <ToolbarButton label="Italic" onClick={() => runEditorCommand("italic")}>
                  <span className="italic">I</span>
                </ToolbarButton>
                <ToolbarButton
                  label="Underline"
                  onClick={() => runEditorCommand("underline")}
                >
                  <span className="underline">U</span>
                </ToolbarButton>
                <ToolbarDivider />
                <ToolbarButton label="Align left" onClick={() => runEditorCommand("justifyLeft")}>
                  <span className="text-[11px]">L</span>
                </ToolbarButton>
                <ToolbarButton
                  label="Align center"
                  onClick={() => runEditorCommand("justifyCenter")}
                >
                  <span className="text-[11px]">C</span>
                </ToolbarButton>
                <ToolbarButton label="Align right" onClick={() => runEditorCommand("justifyRight")}>
                  <span className="text-[11px]">R</span>
                </ToolbarButton>
                <ToolbarButton
                  label="Bulleted list"
                  onClick={() => runEditorCommand("insertUnorderedList")}
                >
                  <HugeiconsIcon
                    icon={LeftToRightListBulletIcon}
                    size={17}
                    strokeWidth={1.8}
                  />
                </ToolbarButton>
                <ToolbarButton
                  label="Numbered list"
                  onClick={() => runEditorCommand("insertOrderedList")}
                >
                  <HugeiconsIcon
                    icon={LeftToRightListNumberIcon}
                    size={17}
                    strokeWidth={1.8}
                  />
                </ToolbarButton>
                <ToolbarDivider />
                <ToolbarButton label="Add link" onClick={addLink}>
                  <HugeiconsIcon icon={Link01Icon} size={17} strokeWidth={1.8} />
                </ToolbarButton>
                <ToolbarButton label="Insert image" onClick={addImage}>
                  <HugeiconsIcon icon={Image01Icon} size={17} strokeWidth={1.8} />
                </ToolbarButton>
                <ToolbarButton
                  label="HTML block"
                  onClick={() => runEditorCommand("formatBlock", "blockquote")}
                  className="ml-auto"
                >
                  {"<>"}
                </ToolbarButton>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  insertLocalImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[300px] px-7 py-7 text-[14px] font-normal leading-[23px] text-[#334155] outline-none [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p:first-child]:text-[18px] [&_p:first-child]:font-bold [&_p:first-child]:leading-7 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-6"
              />
            </div>
          </div>

          <div>
            <p className="text-[14px] font-normal leading-5 text-[#475569]">
              Attachments
            </p>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addAttachments(event.dataTransfer.files);
              }}
              className="mt-2 flex min-h-[120px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#DCCBFF] bg-[#FCFAFF] text-center text-[#7B6E92] transition hover:border-[#BFA7F5] hover:bg-[#F8F3FF]"
            >
              <HugeiconsIcon icon={Attachment01Icon} size={28} strokeWidth={1.8} />
              <span className="mt-3 text-[14px] font-medium leading-5 text-[#475569]">
                Click to upload or drag and drop
              </span>
              <span className="mt-1 text-[12px] font-normal leading-4 text-[#94A3B8]">
                PDF, JPG, PNG, MP3 or ZIP (max. 10MB)
              </span>
            </button>
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  addAttachments(event.target.files);
                }
                event.target.value = "";
              }}
            />
            {attachments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {attachments.map((file) => (
                  <AttachmentCard
                    key={file.id}
                    file={file}
                    onRemove={() => removeAttachment(file.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-5 rounded border border-[#D7E9DA] bg-[#F5FBF6] px-4 py-3 text-[13px] font-medium text-[#46624E]">
            {successMessage}
          </p>
        ) : null}
      </section>
    </section>
  );
}

function toEditorHtml(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function StatusPill({ user }: { user: PublicUser }) {
  const className =
    user.role === "super_admin"
      ? "bg-[#E2F4E7] text-[#15803D]"
      : user.role === "admin"
        ? "bg-[#FFF4C8] text-[#B45309]"
        : "bg-[#EDF1F6] text-[#64748B]";

  const label =
    user.role === "super_admin"
      ? "Super Admin"
      : user.role === "admin"
        ? "Admin"
        : "User";

  return (
    <span
      className={`inline-flex min-h-6 items-center justify-center rounded-full px-3 text-[10px] font-bold uppercase leading-3 ${className}`}
    >
      {label}
    </span>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-[13px] font-bold text-[#191C1F] transition hover:bg-[#EEF2EE] ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-[#DDE2DD]" />;
}

function AttachmentCard({
  file,
  onRemove,
}: {
  file: AttachmentFile;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-lg border border-[#E5E8EA] bg-white px-3 py-2 text-[11px] font-bold leading-[14px] text-[#334155]">
      <span className="flex h-8 w-9 shrink-0 items-center justify-center rounded bg-[#EEF2FF] text-[10px] text-[#2563EB]">
        {getFileLabel(file.name)}
      </span>
      <span className="min-w-0">
        <span className="block max-w-[180px] truncate">{file.name}</span>
        <span className="block text-[10px] font-normal leading-[15px] text-[#94A3B8]">
          {formatFileSize(file.size)}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#9AA2A0] transition hover:bg-[#FFF0F0] hover:text-[#D84D4D]"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function getFileLabel(name: string) {
  const extension = name.split(".").pop()?.slice(0, 3).toUpperCase();

  return extension || "FILE";
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${Math.max(1, Math.round(size / (1024 * 1024)))}MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))}KB`;
}
