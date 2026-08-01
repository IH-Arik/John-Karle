"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Edit02Icon,
  EyeIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { BillingMetricCard } from "./BillingMetricCard";
import { BillingSummaryRow } from "./BillingSummaryRow";
import { servicePlans } from "./data";
import { ServicePlanEditor } from "./ServicePlanEditor";
import type { PlanEditorMode, ServicePlan } from "./types";

export function SubscriptionBillingContent() {
  const [plans, setPlans] = useState<ServicePlan[]>(servicePlans);
  const [screen, setScreen] = useState<"list" | PlanEditorMode>("list");
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);

  function openPlan(mode: "edit" | "view", plan: ServicePlan) {
    setSelectedPlan(plan);
    setScreen(mode);
  }

  function savePlan(plan: ServicePlan) {
    setPlans((currentPlans) => {
      const exists = currentPlans.some((item) => item.id === plan.id);

      if (exists) {
        return currentPlans.map((item) => (item.id === plan.id ? plan : item));
      }

      return [...currentPlans, plan];
    });
    setSelectedPlan(null);
    setScreen("list");
  }

  if (screen !== "list") {
    return (
      <ServicePlanEditor
        mode={screen}
        plan={selectedPlan}
        onCancel={() => {
          setSelectedPlan(null);
          setScreen("list");
        }}
        onEdit={(plan) => {
          setSelectedPlan(plan);
          setScreen("edit");
        }}
        onSave={savePlan}
      />
    );
  }

  return (
    <section className="w-full">
      <div>
        <h1 className="text-[32px] font-bold leading-tight text-[#46624E]">
          Subscription & Billing
        </h1>
        <p className="mt-2 text-[15px] font-medium text-[#626A64]">
          Manage revenue performance, service plans, and enterprise billing
          accounts.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <BillingMetricCard
          badge="+12.4%"
          eyebrow="Monthly Recurring Revenue"
          value="$142,850"
          visual="bars"
        />
        <BillingMetricCard
          badge="+85 new"
          eyebrow="Subscription Growth"
          value="1,248"
          visual="line"
        />
        <BillingMetricCard
          badge="-0.2%"
          eyebrow="Net Churn Rate"
          tone="danger"
          value="1.8%"
          visual="churn"
        />
      </div>

      <div className="mt-8 flex h-[320px] flex-col items-start gap-0 overflow-hidden rounded-[16px] border border-[rgba(194,200,192,0.3)] bg-white shadow-[0_4px_20px_rgba(63,91,75,0.05)]">
        <div className="flex h-[85px] w-full items-center justify-between gap-6 border-b border-[rgba(194,200,192,0.3)] px-8 py-5">
          <h2 className="flex h-[30px] items-center text-[20px] font-medium leading-[30px] text-[#46624E]">
            Service Plan Distribution
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedPlan(null);
              setScreen("add");
            }}
            className="flex h-11 w-[140.36px] items-center justify-center rounded-[12px] bg-[#46624E] px-5 py-2.5 text-center text-[15px] font-medium leading-6 text-white transition hover:bg-[#3C5544]"
          >
            Add New Plan
          </button>
        </div>

        <div className="w-full overflow-x-auto">
        <table className="h-[233px] min-w-[1080px] w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[236.22px]" />
            <col className="w-[112.84px]" />
            <col className="w-[192.66px]" />
            <col className="w-[170.86px]" />
            <col className="w-[225.42px]" />
            <col className="w-[142px]" />
          </colgroup>
          <thead className="h-[52px] bg-[#F0F3FF]">
            <tr className="h-[52px] text-[16px] font-semibold uppercase leading-[19px] tracking-[0.8px] text-[#727972]">
              <th className="h-[52px] px-8 py-4 font-semibold">Plan Name</th>
              <th className="h-[52px] px-6 py-4 text-center font-semibold">Price</th>
              <th className="h-[52px] px-6 py-4 text-center font-semibold">Storage Limit</th>
              <th className="h-[52px] px-6 py-4 text-center font-semibold">User Count</th>
              <th className="h-[52px] px-6 py-4 text-right font-semibold">Conversion Rate</th>
              <th className="h-[52px] px-6 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, index) => (
              <tr
                key={plan.id}
                className={`bg-white ${
                  index === 0
                    ? "h-[60px]"
                    : index === 1
                      ? "h-[62px] border-t border-[rgba(194,200,192,0.3)]"
                      : "h-[61px] border-t border-[rgba(194,200,192,0.3)]"
                }`}
              >
                <td className="h-full pl-8 pr-6">
                  <div className="flex h-5 items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        index === 0
                          ? "bg-[#486554]"
                          : index === 1
                            ? "bg-[#5E7B65]"
                            : "bg-[#4B435C]"
                      }`}
                    />
                    <span className="text-[16px] font-medium leading-[19px] text-[#111C2D]">
                      {plan.name}
                    </span>
                  </div>
                </td>
                <td className="h-full px-6 py-5 text-center text-[16px] font-normal leading-[19px] text-[#424843]">
                  {plan.price === "Custom" ? "Custom" : `$${plan.price}/mo`}
                </td>
                <td className="h-full px-6 py-5 text-center text-[16px] font-normal leading-[19px] text-[#424843]">
                  {plan.storageLimit === "Unlimited"
                    ? "Unlimited"
                    : `${plan.storageLimit} GB`}
                </td>
                <td className="h-full px-6 py-5 text-center text-[16px] font-normal leading-[19px] text-[#424843]">
                  {plan.userCount}
                </td>
                <td className="h-full px-6 py-5 text-right text-[16px] font-medium leading-[19px] text-[#46624E]">
                  {plan.conversionRate}
                </td>
                <td className="h-full px-6 py-5">
                  <div className="flex justify-end gap-3 text-[#647064]">
                    <button
                      type="button"
                      aria-label={`View ${plan.name}`}
                      title="View"
                      onClick={() => openPlan("view", plan)}
                      className="flex h-9 w-9 items-center justify-center rounded border border-[#E0E5DE] transition hover:border-[#46624E] hover:bg-[#F2F4EE] hover:text-[#46624E]"
                    >
                      <HugeiconsIcon icon={EyeIcon} size={20} strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${plan.name}`}
                      title="Edit"
                      onClick={() => openPlan("edit", plan)}
                      className="flex h-9 w-9 items-center justify-center rounded border border-[#E0E5DE] transition hover:border-[#46624E] hover:bg-[#F2F4EE] hover:text-[#46624E]"
                    >
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        size={20}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start gap-6 xl:h-[308px] xl:flex-row">
        <section className="flex w-full flex-1 flex-col items-start overflow-hidden rounded-[16px] border border-[rgba(194,200,192,0.3)] bg-white shadow-[0_4px_20px_rgba(63,91,75,0.05)] xl:h-[297px]">
          <h2 className="flex h-[71px] w-full items-center border-b border-[rgba(194,200,192,0.3)] px-8 py-5 text-[20px] font-medium leading-[30px] text-[#46624E]">
            Recent Billing Activity
          </h2>
          <div className="w-full xl:h-56">
            {[
              [
                "Eleanor Vance",
                "ST-938210 - sanctuary-core",
                "$29.00",
                "Oct 24, 2023",
                "Successful",
              ],
              [
                "Julian Blackwood",
                "ST-884122 - archive-pro",
                "$89.00",
                "Oct 23, 2023",
                "Failed",
              ],
              [
                "Sophia Meriam",
                "ST-102934 - sanctuary-core",
                "$29.00",
                "Oct 22, 2023",
                "Successful",
              ],
            ].map(([name, detail, amount, date, status], index) => (
              <div
                key={name}
                className={`flex min-h-[74px] w-full flex-col gap-3 px-5 py-4 sm:h-[75px] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-8 ${
                  index === 0 ? "" : "border-t border-[rgba(194,200,192,0.2)]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      status === "Failed"
                        ? "bg-[#FFDAD6] text-[#BA1A1A]"
                        : "bg-[#CAEAD5] text-[#46624E]"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={status === "Failed" ? Alert01Icon : Invoice01Icon}
                      size={status === "Failed" ? 20 : 22}
                      strokeWidth={1.8}
                      className={
                        status === "Failed" ? "h-5 w-5" : "h-4 w-[22px]"
                      }
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold leading-6 text-[#111C2D]">
                      {name}
                    </p>
                    <p className="truncate text-[12px] font-normal leading-[18px] text-[#727972]">
                      {detail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:gap-5">
                  <div className="text-left sm:text-right">
                    <p className="text-[15px] font-bold leading-6 text-[#111C2D]">
                      {amount}
                    </p>
                    <p className="text-[12px] font-normal leading-[18px] text-[#727972]">
                      {date}
                    </p>
                  </div>
                  <span
                    className={`flex h-[22px] items-center rounded-full px-3 py-[2.5px] text-[11px] font-bold leading-4 ${
                      status === "Failed"
                        ? "bg-[#FFDAD6] text-[#93000A]"
                        : "bg-[#CAEAD5] text-[#314D3D]"
                    }`}
                  >
                    {status}
                  </span>
                  <button
                    type="button"
                    aria-label={`More actions for ${name}`}
                    className="flex h-4 w-1 flex-col items-center justify-center gap-1"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#727972]" />
                    <span className="h-1 w-1 rounded-full bg-[#727972]" />
                    <span className="h-1 w-1 rounded-full bg-[#727972]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex h-[308px] w-full flex-1 flex-col items-start gap-4 rounded-[16px] border border-[rgba(194,200,192,0.3)] bg-white p-8 shadow-[0_4px_20px_rgba(63,91,75,0.05)]">
          <p className="flex h-6 w-full items-center text-[16px] font-normal uppercase leading-6 tracking-[0.8px] text-[#727972]">
            Renewal Monitoring
          </p>
          <div className="flex w-full flex-col items-start gap-4 pb-2">
            <BillingSummaryRow label="Next Auto-Pay Cycle" value="Oct 24, 2023" />
            <BillingSummaryRow label="Pending Settlements" value="$1,420.00" />
            <BillingSummaryRow
              danger
              label="Dunning Active"
              value="4 Accounts"
            />
          </div>
          <button
            type="button"
            className="flex h-[50px] w-full items-center justify-center rounded-[12px] border border-[#727972] bg-white px-0 py-3 text-[15px] font-medium leading-6 text-[#111C2D] transition hover:bg-[#F2F4EE]"
          >
            View Stripe Dashboard
          </button>
        </section>
      </div>
    </section>
  );
}
