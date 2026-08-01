"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat01Icon,
  Alert01Icon,
  DatabaseIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";

const insightMetrics = [
  {
    label: "AI Conversational Ops",
    value: "12,482",
    badge: "+12.4%",
    icon: AiChat01Icon,
    tone: "success",
  },
  {
    label: "Grounded Rate",
    value: "97.2%",
    badge: "Target 95%",
    icon: DatabaseIcon,
    tone: "purple",
  },
  {
    label: "Hallucination Prev.",
    value: "99.8%",
    badge: "Safe",
    icon: Alert01Icon,
    tone: "danger",
  },
  {
    label: "Avg. Confidence",
    value: "0.94",
    badge: "High",
    icon: Shield01Icon,
    tone: "success",
  },
];

const funnelSteps = [
  ["100%", "Unknown Query", "border-[#D8DDF0] bg-[#EEF2FF] text-[#50617A]"],
  [
    "42%",
    "Missing Memory Identified",
    "border-[#D8C8F5] bg-[#F1E9FF] text-[#7760A8]",
  ],
  ["12%", "Blocked Fabrications", "border-[#BA1A1A] bg-[#FFDAD6] text-[#BA1A1A]"],
  ["100%", "Safe Fallback", "border-[#C9DFCF] bg-[#E7F4EA] text-[#46624E]"],
];

const lastRowHeadingClass =
  "text-[12px] font-medium leading-[14px] tracking-[0.24px] text-[#424843] [font-family:Inter,Arial,sans-serif]";

export function AiInsightsContent() {
  return (
    <section className="w-full">
      <div>
        <h1 className="text-[30px] font-bold leading-tight text-[#172235]">
          Analytics Overview
        </h1>
        <p className="mt-2 text-[15px] font-medium text-[#626A64]">
          Monitor grounding quality, safety, and conversational intelligence.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {insightMetrics.map((metric) => (
              <InsightMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <section className="rounded-lg border border-[#E6E6E0] bg-white p-8 shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="w-full text-center align-middle text-[20px] font-medium leading-[30px] tracking-[0px] text-[#5B735F] sm:w-auto">
                Grounding & Source Integrity
              </h2>
              <div className="flex gap-5 text-[11px] font-bold text-[#667085]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#46624E]" />
                  Grounded
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#77738B]" />
                  Unsupported
                </span>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-[#F7F9FA]">
              <svg
                viewBox="0 0 760 260"
                className="h-[clamp(260px,30vw,430px)] w-full text-[#46624E]"
                aria-label="Grounding and source integrity trend"
              >
                <path
                  d="M0 205 C80 190, 160 210, 240 178 S350 68, 455 52 S630 64, 760 38 L760 260 L0 260 Z"
                  fill="#E4EBE8"
                />
                <path
                  d="M0 205 C80 190, 160 210, 240 178 S350 68, 455 52 S630 64, 760 38"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
                {[35, 125, 215, 305, 395, 485, 575, 665].map(
                  (x, index) => (
                    <rect
                      key={x}
                      x={x}
                      y={index % 3 === 0 ? 210 : 198}
                      width="72"
                      height={index % 3 === 0 ? 34 : 46}
                      rx="2"
                      className={
                        index === 2 || index === 3 || index === 5
                          ? "fill-[#46624E]"
                          : "fill-[#C7D1CD]"
                      }
                      opacity={index === 2 || index === 3 || index === 5 ? 0.72 : 1}
                    />
                  ),
                )}
              </svg>
            </div>
          </section>

          <section className="rounded-lg border border-[#E6E6E0] bg-white p-5 shadow-[0_12px_30px_rgba(31,47,40,0.06)] sm:p-7">
            <h2 className="text-center align-middle text-[20px] font-medium leading-[30px] tracking-[0px] text-[#66756A]">
              Hallucination Prevention Funnel
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-4">
              {funnelSteps.map(([value, label, className]) => (
                <div key={label} className="flex flex-col items-center">
                  <span
                    className={`flex h-16 w-16 flex-none items-center justify-center rounded-full border-2 p-0 text-[20px] font-bold leading-[30px] tracking-[0px] [font-family:Inter,Arial,sans-serif] ${className}`}
                  >
                    {value}
                  </span>
                  <p className="mt-3 text-center text-[11px] font-bold leading-4 text-[#526052]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ToneDistribution />
            <RetrievalPipeline />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <MiniGauge label="GPU Load" value="75%" />
            <MiniStat label="Avg Latency" value="1.2s" note="Optimal" />
            <CostBreakdown />
          </div>
        </div>

        <aside className="space-y-6">
          <TrustScoreCard />
          <LiveAlerts />
          <AiTuningActions />
          <div className="overflow-hidden rounded-lg border border-[#E6E6E0] bg-white shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
            <Image
              src="/ai-insight-lastImg.png"
              alt="AI insight signal waves"
              width={308}
              height={198}
              className="h-auto w-full"
              priority={false}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function InsightMetricCard({
  metric,
}: {
  metric: (typeof insightMetrics)[number];
}) {
  const toneClass =
    metric.tone === "danger"
      ? "bg-[#FFE9E9] text-[#D84D4D]"
      : metric.tone === "purple"
        ? "bg-[#EFEAFF] text-[#7760A8]"
        : "bg-[#DCEFE3] text-[#46624E]";

  return (
    <article className="rounded-lg border border-[#E6E6E0] bg-white p-5 shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}
        >
          <HugeiconsIcon icon={metric.icon} size={18} strokeWidth={1.8} />
        </span>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${toneClass}`}>
          {metric.badge}
        </span>
      </div>
      <p className="mt-4 min-h-[32px] text-[11px] font-bold uppercase leading-4 text-[#8A928B]">
        {metric.label}
      </p>
      <p className="mt-2 text-[27px] font-bold text-[#46624E]">
        {metric.value}
      </p>
      <div className="mt-4 h-8">
        {metric.label === "Avg. Confidence" ? (
          <div className="mt-4 h-3 rounded-full bg-[#D6E9DD]">
            <div className="h-full w-[82%] rounded-full bg-[#A9DDC0]" />
          </div>
        ) : metric.label === "Grounded Rate" ? (
          <div className="mt-3 h-4 rounded-full bg-[#E5EBE6]">
            <div className="h-full w-[88%] rounded-full bg-[#46624E]" />
          </div>
        ) : (
          <svg viewBox="0 0 120 32" className="h-8 w-full text-[#46624E]">
            <path
              d="M4 24 C22 14, 35 27, 50 18 S80 10, 116 16"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        )}
      </div>
    </article>
  );
}

function TrustScoreCard() {
  return (
    <section className="rounded-lg bg-[#66816B] p-6 text-white shadow-[0_12px_30px_rgba(31,47,40,0.10)]">
      <p className="text-[11px] font-bold uppercase leading-4 tracking-wide text-white/75">
        Global Trust Score
      </p>
      <div className="mt-7 flex justify-center">
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-white/85">
          <span className="text-[30px] font-bold leading-none">94</span>
          <span className="mt-1 text-[10px] font-bold uppercase">Percent</span>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[170px] text-center text-[12px] font-medium leading-5 text-white/80">
        System performance is exceeding sanctuary reliability standards.
      </p>
    </section>
  );
}

function LiveAlerts() {
  return (
    <section className="rounded-lg border border-[#E6E6E0] bg-white p-5 shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#66756A]">Live Alerts</h2>
        <span className="h-2 w-2 rounded-full bg-[#D84D4D]" />
      </div>
      <div className="mt-4 space-y-3">
        <AlertCard
          title="Latency Surge"
          detail="Region EU-West: +400ms"
          tone="danger"
        />
        <AlertCard
          title="Moderation Queue"
          detail="12 flags awaiting review"
          tone="purple"
        />
      </div>
    </section>
  );
}

function AlertCard({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "danger" | "purple";
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "danger"
          ? "border-[#F2CACA] bg-[#FFF4F4]"
          : "border-[#E4DAFA] bg-[#FAF7FF]"
      }`}
    >
      <p
        className={`text-[12px] font-bold ${
          tone === "danger" ? "text-[#D84D4D]" : "text-[#7760A8]"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-[11px] font-semibold leading-4 text-[#526052]">
        {detail}
      </p>
    </div>
  );
}

function AiTuningActions() {
  return (
    <section className="rounded-lg border border-[#E6E6E0] bg-white p-5 shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
      <h2 className="text-[16px] font-bold text-[#66756A]">
        AI Tuning Actions
      </h2>
      <ul className="mt-4 space-y-4 text-[12px] font-semibold leading-5 text-[#687168]">
        <li>Update grounding sources for 2024 Family Timeline index.</li>
        <li>Adjust empathy temperature for bereavement-related queries.</li>
      </ul>
      <button
        type="button"
        className="mt-5 h-10 w-full rounded-lg bg-[#EEF2FF] text-[12px] font-bold text-[#46624E] transition hover:bg-[#E4EAF9]"
      >
        Optimize All Systems
      </button>
    </section>
  );
}

function ToneDistribution() {
  const rows = [
    ["Warm & Empathetic", "64%", "w-[64%] bg-[#46624E]", "text-[#111C2D]"],
    ["Neutral / Informative", "28%", "w-[28%] bg-[#486554]", "text-[#111C2D]"],
    ["Confused (Re-grounding)", "7%", "w-[7%] bg-[#7A708C]", "text-[#111C2D]"],
    ["Dependency Flags", "1%", "w-[1%] bg-[#BA1A1A]", "text-[#BA1A1A]"],
  ];

  return (
    <section className="flex h-[286px] flex-col items-start gap-6 rounded-[16px] border border-[#E8E6E1] bg-white px-8 pb-[44.37px] pt-8">
      <h2 className="flex h-[30px] w-full items-center text-[20px] font-medium leading-[30px] tracking-[0px] text-[#46624E] [font-family:Inter,Arial,sans-serif]">
        Tone Distribution
      </h2>
      <div className="flex w-full flex-col items-start gap-4">
        {rows.map(([label, value, barClassName, textClassName]) => (
          <div key={label} className="flex w-full flex-col items-start gap-1">
            <div
              className={`flex h-[14.41px] w-full items-start justify-between text-[12px] font-medium leading-[14px] tracking-[0.24px] [font-family:Inter,Arial,sans-serif] ${textClassName}`}
            >
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8EEFF]">
              <div className={`h-full ${barClassName}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RetrievalPipeline() {
  return (
    <section className="isolate relative flex h-[286px] flex-col items-start gap-4 overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white p-8">
      <Image
        src="/ai-insight-star-icon.png"
        alt=""
        width={160}
        height={153}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-15px] right-[-14.83px] z-[1] h-[153.33px] w-[160px] opacity-[0.05]"
      />
      <h2 className="relative z-0 flex h-[30px] w-full items-center text-[20px] font-medium leading-[30px] tracking-[0px] text-[#46624E] [font-family:Inter,Arial,sans-serif]">
        Retrieval Pipeline
      </h2>
      <div className="relative z-[2] flex w-full flex-col items-start gap-3">
        {[
          ["01", "Neural Query Analysis", "12ms"],
          ["02", "Vector Memory Search", "45ms"],
          ["03", "Source Fact Grounding", "122ms"],
        ].map(([step, label, time]) => (
          <div
            key={step}
            className="flex h-[50px] w-full items-center gap-3 rounded-[12px] border border-[rgba(70,98,78,0.1)] bg-[rgba(70,98,78,0.05)] p-3"
          >
            <span className="flex h-5 min-w-[18px] items-center text-[13px] font-bold leading-5 text-[#46624E] [font-family:Inter,Arial,sans-serif]">
              {step}
            </span>
            <span className="flex min-w-0 flex-1 items-center truncate text-[15px] font-medium leading-6 text-[#111C2D] [font-family:Inter,Arial,sans-serif]">
              {label}
            </span>
            <span className="flex min-w-[31px] items-center justify-end text-[12px] font-medium leading-[14px] tracking-[0.24px] text-[#424843] [font-family:Inter,Arial,sans-serif]">
              {time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniGauge({ label, value }: { label: string; value: string }) {
  return (
    <section className="flex h-[152.41px] flex-col items-center justify-center rounded-[16px] border border-[#E8E6E1] bg-white p-4 text-center">
      <p className={lastRowHeadingClass}>{label}</p>
      <div className="relative mt-[7.41px] flex h-24 w-24 items-center justify-center">
        <svg
          viewBox="0 0 96 96"
          aria-label={`${label} gauge`}
          className="h-24 w-24 -rotate-90"
        >
          <circle
            cx="48"
            cy="48"
            r="36"
            fill="none"
            stroke="#E8EEFF"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            fill="none"
            stroke="#46624E"
            strokeDasharray="169.65 226.19"
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[20px] font-bold leading-[30px] text-[#46624E] [font-family:Inter,Arial,sans-serif]">
          {value}
        </span>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <section className="flex h-[151.92px] flex-col items-center justify-center rounded-[16px] border border-[#E8E6E1] bg-white px-4 pb-[31.87px] pt-[31.84px] text-center">
      <p className={lastRowHeadingClass}>{label}</p>
      <p className="mt-[6.41px] text-[32px] font-semibold leading-[45px] tracking-[-0.64px] text-[#46624E] [font-family:Inter,Arial,sans-serif]">
        {value}
      </p>
      <p className="text-[13px] font-bold leading-5 text-[#46624E] [font-family:Inter,Arial,sans-serif]">
        {note}
      </p>
    </section>
  );
}

function CostBreakdown() {
  return (
    <section className="flex h-[152.41px] flex-col items-start rounded-[16px] border border-[#E8E6E1] bg-white px-4 pb-[24.01px] pt-4">
      <p className={lastRowHeadingClass}>Cost Breakdown</p>
      <div className="mt-[15.41px] flex h-20 w-full items-center gap-4">
        <svg
          viewBox="0 0 80 80"
          aria-label="Cost breakdown donut chart"
          className="h-20 w-20 shrink-0 -rotate-90"
        >
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#5E7B65"
            strokeWidth="10"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#CDC1E0"
            strokeDasharray="54.98 219.91"
            strokeLinecap="butt"
            strokeWidth="10"
          />
        </svg>
        <div className="min-w-0 flex-1 space-y-1 text-[13px] leading-5 text-[#111C2D] [font-family:Inter,Arial,sans-serif]">
          <p className="flex justify-between gap-3">
            <span>LLM</span>
            <span className="font-bold">$420</span>
          </p>
          <p className="flex justify-between gap-3">
            <span>Storage</span>
            <span className="font-bold">$84</span>
          </p>
        </div>
      </div>
    </section>
  );
}
