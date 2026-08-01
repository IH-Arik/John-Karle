type BillingMetricCardProps = {
  eyebrow: string;
  value: string;
  badge: string;
  visual: "bars" | "line" | "churn";
  tone?: "success" | "danger";
};

export function BillingMetricCard({
  eyebrow,
  value,
  badge,
  visual,
  tone = "success",
}: BillingMetricCardProps) {
  return (
    <article className="min-h-[220px] rounded-lg border border-[#E6E6E0] bg-white p-7 shadow-[0_12px_30px_rgba(31,47,40,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[150px] text-[13px] font-bold uppercase leading-5 tracking-wide text-[#A0A49F]">
          {eyebrow}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            tone === "danger"
              ? "bg-[#FFDCDC] text-[#D85D5D]"
              : "bg-[#CFE8D7] text-[#46624E]"
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-3 text-[30px] font-bold text-[#46624E]">{value}</p>

      {visual === "bars" ? (
        <div className="mt-12 flex h-16 items-end gap-2">
          {[22, 31, 25, 37, 48, 55, 57].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-8 rounded-t-sm ${
                index > 4 ? "bg-[#46624E]" : "bg-[#D9DEDA]"
              }`}
              style={{ height }}
            />
          ))}
        </div>
      ) : visual === "line" ? (
        <svg viewBox="0 0 220 80" className="mt-8 h-20 w-full text-[#46624E]">
          <path
            d="M4 58 C42 53, 62 50, 86 43 S130 22, 158 27 S192 31, 216 20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <div className="mt-10">
          <div className="h-2 overflow-hidden rounded-full bg-[#EDF0FA]">
            <div className="h-full w-[18%] rounded-full bg-[#D74747]" />
          </div>
          <p className="mt-3 text-[11px] font-semibold text-[#A0A49F]">
            Healthy benchmark: &lt; 3.0%
          </p>
        </div>
      )}
    </article>
  );
}
