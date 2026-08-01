"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Message01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import {
  getApiErrorMessage,
  useGetAdminReportFeedbackByIdQuery,
  useGetAdminReportFeedbackQuery,
  useUpdateAdminReportFeedbackStatusMutation,
} from "../../../lib/api";
import type {
  ReportFeedback,
  ReportFeedbackPriority,
  ReportFeedbackStatus,
  ReportFeedbackType,
} from "../../../lib/types";

const statusOptions: Array<{ label: string; value: ReportFeedbackStatus | "All" }> = [
  { label: "All Statuses", value: "All" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const typeOptions: Array<{ label: string; value: ReportFeedbackType | "All" }> = [
  { label: "All Types", value: "All" },
  { label: "Problem", value: "problem" },
  { label: "Feedback", value: "feedback" },
  { label: "Bug", value: "bug" },
];

const priorityOptions: Array<{ label: string; value: ReportFeedbackPriority | "All" }> = [
  { label: "All Priorities", value: "All" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export function ReportsContent() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportFeedbackStatus | "All">("All");
  const [type, setType] = useState<ReportFeedbackType | "All">("All");
  const [priority, setPriority] = useState<ReportFeedbackPriority | "All">("All");
  const [page, setPage] = useState(1);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading, error, isFetching } = useGetAdminReportFeedbackQuery({
    page,
    limit: pageSize,
    search: search.trim() || undefined,
    status: status === "All" ? undefined : status,
    type: type === "All" ? undefined : type,
    priority: priority === "All" ? undefined : priority,
  });

  const reports = data?.reports ?? [];
  const pagination = data?.pagination;
  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setType("All");
    setPriority("All");
    setPage(1);
  }

  return (
    <>
      <section className="w-full">
        <div className="overflow-hidden rounded-lg border border-[#E2E6DF] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.08)]">
          <header className="bg-[#66785F] px-5 py-5 sm:px-7">
            <h1 className="text-[30px] font-bold leading-tight text-white sm:text-[34px]">
              Report Feedback
            </h1>
            <p className="mt-2 text-[14px] font-medium text-white/85">
              Review user-submitted problems and product feedback from the admin queue.
            </p>
          </header>

          <div className="border-b border-[#E8EDE6] px-5 py-5 sm:px-7">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(0,1fr))]">
              <label className="relative block">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  strokeWidth={1.8}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search subject or message"
                  className="h-11 w-full rounded-lg border border-[#E2E6EA] bg-[#F8FAFD] pl-11 pr-4 text-[14px] font-normal text-[#334155] outline-none transition focus:border-[#66785F] focus:bg-white"
                />
              </label>

              <FilterSelect
                value={status}
                onChange={(value) => {
                  setStatus(value as ReportFeedbackStatus | "All");
                  setPage(1);
                }}
                options={statusOptions}
              />
              <FilterSelect
                value={type}
                onChange={(value) => {
                  setType(value as ReportFeedbackType | "All");
                  setPage(1);
                }}
                options={typeOptions}
              />
              <FilterSelect
                value={priority}
                onChange={(value) => {
                  setPriority(value as ReportFeedbackPriority | "All");
                  setPage(1);
                }}
                options={priorityOptions}
              />

              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-lg border border-[#D6DAD4] bg-white px-4 text-[13px] font-bold text-[#5E685F] transition hover:bg-[#F2F4EE]"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[18%]" />
                <col className="w-[24%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#AEB6AE] text-[12px] font-bold uppercase tracking-[0.08em] text-[#879083]">
                  <th className="px-6 py-5">S.ID</th>
                  <th className="px-6 py-5">Submitted By</th>
                  <th className="px-6 py-5">Subject</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Priority</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-[14px] font-medium text-[#7B827B]"
                    >
                      Loading report feedback...
                    </td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((report, index) => (
                    <tr
                      key={report.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => setSelectedReportId(report.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedReportId(report.id);
                        }
                      }}
                      className="cursor-pointer border-b border-[#ECEFEC] text-[13px] font-semibold text-[#334155] transition hover:bg-[#F7F9F7]"
                    >
                      <td className="px-6 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-6 py-4">
                        <ReportUser report={report} seed={index} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#2D384B]">{report.subject}</p>
                          <p className="mt-1 truncate font-medium text-[#667085]">
                            {report.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TypeBadge type={report.type} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={report.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-[#526052]">
                        {formatDateTime(report.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-[14px] font-medium text-[#7B827B]"
                    >
                      No report feedback matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-4 px-5 py-7 text-[#7B8778] sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[14px] font-semibold uppercase">
              Showing {(currentPage - 1) * pageSize + (reports.length ? 1 : 0)}-
              {(currentPage - 1) * pageSize + reports.length} of {pagination?.total ?? 0}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Previous reports page"
                disabled={currentPage === 1 || isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex h-8 w-8 items-center justify-center rounded text-[#7B827B] transition hover:bg-[#F2F4EE] disabled:opacity-35"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} />
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-8 min-w-8 rounded px-3 text-[13px] font-bold transition ${
                      currentPage === item
                        ? "bg-[#66785F] text-white"
                        : "text-[#8B918B] hover:bg-[#F2F4EE]"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Next reports page"
                disabled={currentPage === totalPages || isFetching}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="flex h-8 w-8 items-center justify-center rounded text-[#7B827B] transition hover:bg-[#F2F4EE] disabled:opacity-35"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </footer>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
            {getApiErrorMessage(error, "Report feedback could not be loaded.")}
          </p>
        ) : null}
      </section>

      <ReportDetailsDrawer
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-lg border border-[#E2E6EA] bg-white px-3 text-[14px] font-medium text-[#334155] outline-none transition focus:border-[#66785F]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ReportUser({ report, seed }: { report: ReportFeedback; seed: number }) {
  const name = report.user?.name ?? "Unknown User";
  const subLabel = report.user?.email ?? report.userId;
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "from-[#8AC0D6] to-[#E8B090]",
    "from-[#A4C7A5] to-[#F0C28B]",
    "from-[#9CA8D5] to-[#BEE0D2]",
  ];

  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${colors[seed % colors.length]} text-[10px] font-bold text-white ring-2 ring-white`}
      >
        {initials || "NA"}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{name}</span>
        <span className="block truncate text-[11px] font-medium text-[#7B827B]">
          {subLabel}
        </span>
      </span>
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex min-h-[24px] items-center rounded-full bg-[#EEF2FF] px-3 text-[11px] font-bold uppercase text-[#55637F]">
      {type.replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const className =
    priority === "high"
      ? "bg-[#FFE9E9] text-[#C24D4D]"
      : priority === "medium"
        ? "bg-[#FFF3DB] text-[#9A6A17]"
        : "bg-[#EAF5ED] text-[#55725D]";

  return (
    <span className={`inline-flex min-h-[24px] items-center rounded-full px-3 text-[11px] font-bold uppercase ${className}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "resolved"
      ? "bg-[#D7F2DE] text-[#55725D]"
      : status === "closed"
        ? "bg-[#ECEFF4] text-[#5C6778]"
        : status === "in_progress"
          ? "bg-[#FFF3DB] text-[#9A6A17]"
          : "bg-[#FFE9E9] text-[#C24D4D]";

  return (
    <span className={`inline-flex min-h-[24px] items-center rounded-full px-3 text-[11px] font-bold uppercase ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function ReportDetailsDrawer({
  reportId,
  onClose,
}: {
  reportId: string | null;
  onClose: () => void;
}) {
  const { data, error, isLoading } = useGetAdminReportFeedbackByIdQuery(reportId ?? "", {
    skip: !reportId,
  });
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAdminReportFeedbackStatusMutation();
  const [statusValue, setStatusValue] = useState<ReportFeedbackStatus>("open");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const report = data?.report;

  useEffect(() => {
    if (report?.status) {
      setStatusValue(report.status);
    }
  }, [report?.status]);

  useEffect(() => {
    if (reportId) {
      const timeout = window.setTimeout(() => setIsVisible(true), 20);
      return () => window.clearTimeout(timeout);
    }

    setIsVisible(false);
    return undefined;
  }, [reportId]);

  if (!reportId) {
    return null;
  }

  async function handleUpdateStatus() {
    if (!reportId) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
      await updateStatus({ reportId, status: statusValue }).unwrap();
      setSuccessMessage("Report status updated successfully.");
    } catch (updateError) {
      setErrorMessage(getApiErrorMessage(updateError, "Status could not be updated."));
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close report details"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#263029]/20 transition-opacity duration-300 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col border-l border-[#E6E6E0] bg-white shadow-[-18px_0_45px_rgba(31,47,40,0.12)] transition-transform duration-300 ease-out sm:w-[440px] ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#ECEDEA] px-5">
          <h2 className="text-[17px] font-bold text-[#334155]">Report Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report details"
            className="flex h-9 w-9 items-center justify-center rounded text-[#334155] transition hover:bg-[#F2F4EE]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-7">
          {isLoading ? (
            <p className="text-[14px] font-medium text-[#626A64]">Loading report details...</p>
          ) : error ? (
            <p className="rounded-lg border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
              {getApiErrorMessage(error, "Report details could not be loaded.")}
            </p>
          ) : report ? (
            <div className="space-y-6">
              <section className="rounded-lg bg-[#F6F7FF] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#667085]">
                  Overview
                </p>
                <div className="mt-4 space-y-4">
                  <InfoRow label="Subject" value={report.subject} />
                  <InfoRow label="Submitted By" value={report.user?.name ?? report.userId} />
                  <InfoRow label="Email" value={report.user?.email ?? "Unavailable"} />
                  <InfoRow label="Type" value={report.type} />
                  <InfoRow label="Category" value={report.category} />
                  <InfoRow label="Priority" value={report.priority} />
                  <InfoRow label="Created" value={formatDateTime(report.createdAt)} />
                </div>
              </section>

              <section className="rounded-lg border border-[#E6E6E0] p-5">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={Message01Icon}
                    size={22}
                    strokeWidth={1.8}
                    className="text-[#55725D]"
                  />
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#334155]">
                    Message
                  </p>
                </div>
                <p className="mt-4 text-[14px] leading-7 text-[#526052]">{report.message}</p>
              </section>

              <section className="rounded-lg border border-[#E6E6E0] p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#334155]">
                  Admin Actions
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-[13px] font-semibold text-[#5E685F]">Status</span>
                    <select
                      value={statusValue}
                      onChange={(event) => setStatusValue(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-[#D6DAD4] bg-white px-3 text-[14px] font-medium text-[#334155] outline-none transition focus:border-[#66785F]"
                    >
                      {statusOptions
                        .filter((option) => option.value !== "All")
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </label>

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
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className="h-11 w-full rounded-lg bg-[#66785F] text-[14px] font-bold text-white transition hover:bg-[#596B53] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-[#747C76]">{label}</p>
      <p className="mt-1 break-words text-[13px] font-bold leading-5 text-[#334155]">
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
