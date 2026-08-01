import type { ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

type PlanFormSectionProps = {
  title: string;
  icon: IconSvgElement;
  badge?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function PlanFormSection({
  title,
  icon,
  badge,
  className = "",
  contentClassName = "",
  children,
}: PlanFormSectionProps) {
  return (
    <section
      className={`rounded-[16px] border border-[rgba(194,200,192,0.3)] bg-white p-6 shadow-[0_4px_20px_rgba(63,91,75,0.05)] sm:p-8 ${className}`}
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(94,123,101,0.2)] text-[#46624E]">
            <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
          </span>
          <h2 className="text-[20px] font-medium leading-[30px] text-[#111C2D]">
            {title}
          </h2>
        </div>
        {badge ? (
          <span className="rounded-full bg-[#CAEAD5] px-3 py-1 text-[12px] font-medium leading-[18px] text-[#4E6B5A]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}

type PlanTextFieldProps = {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  hint?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function PlanTextField({
  label,
  value,
  readOnly,
  onChange,
  hint,
  prefix,
  suffix,
  className = "",
}: PlanTextFieldProps) {
  return (
    <label className={className}>
      <span className="text-[16px] font-normal leading-6 text-[#424843]">
        {label}
      </span>
      <span className="relative mt-2 block">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] font-normal leading-6 text-[#424843]">
            {prefix}
          </span>
        ) : null}
        <input
          readOnly={readOnly}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-[50px] w-full rounded-[12px] border text-[16px] font-normal leading-6 text-[#111C2D] outline-none transition ${
            readOnly
              ? "border-[#C2C8C0] bg-[#F0F3FF]"
              : "border-[#C2C8C0] bg-[#F0F3FF] focus:border-[#46624E] focus:bg-white"
          } ${prefix ? "pl-8" : "pl-4"} ${suffix ? "pr-14" : "pr-4"}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] font-normal leading-6 text-[#424843]">
            {suffix}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span className="mt-1 block text-[11px] font-normal leading-4 text-[#424843]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

type PlanSelectFieldProps = {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
};

export function PlanSelectField({
  label,
  value,
  readOnly,
  onChange,
  options,
  className = "",
}: PlanSelectFieldProps) {
  return (
    <label className={className}>
      <span className="text-[16px] font-normal leading-6 text-[#424843]">
        {label}
      </span>
      <select
        disabled={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-[50px] w-full rounded-[12px] border px-3 text-[16px] font-normal leading-6 text-[#111C2D] outline-none transition disabled:opacity-100 ${
          readOnly
            ? "border-[#C2C8C0] bg-[#F0F3FF]"
            : "border-[#C2C8C0] bg-[#F0F3FF] focus:border-[#46624E] focus:bg-white"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PlanHealthMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] bg-[#F9F9FF] p-3">
      <p className="text-[10px] font-bold uppercase leading-[15px] text-[#424843]">
        {label}
      </p>
      <p className="text-[20px] font-bold leading-[30px] text-[#46624E]">
        {value}
      </p>
    </div>
  );
}
