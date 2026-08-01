type BillingSummaryRowProps = {
  label: string;
  value: string;
  danger?: boolean;
};

export function BillingSummaryRow({
  label,
  value,
  danger = false,
}: BillingSummaryRowProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <p className="text-[15px] font-normal leading-6 text-[#424843]">
        {label}
      </p>
      <p
        className={`text-right text-[15px] font-semibold leading-6 ${
          danger ? "text-[#BA1A1A]" : "text-[#111C2D]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
