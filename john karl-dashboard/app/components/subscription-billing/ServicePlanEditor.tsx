"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare01Icon,
  DatabaseIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { planFeatureOptions } from "./data";
import {
  PlanFormSection,
  PlanHealthMini,
  PlanSelectField,
  PlanTextField,
} from "./PlanFormFields";
import type { PlanEditorMode, ServicePlan } from "./types";

type ServicePlanEditorProps = {
  mode: PlanEditorMode;
  plan: ServicePlan | null;
  onCancel: () => void;
  onEdit: (plan: ServicePlan) => void;
  onSave: (plan: ServicePlan) => void;
};

export function ServicePlanEditor({
  mode,
  plan,
  onCancel,
  onEdit,
  onSave,
}: ServicePlanEditorProps) {
  const isView = mode === "view";
  const isAdd = mode === "add";
  const initialPlan =
    plan ??
    ({
      id: "new-plan",
      name: "",
      price: "",
      billingCycle: "Monthly",
      storageLimit: "",
      userLimit: "",
      userCount: "0 users",
      conversionRate: "0.0%",
      activeSubscribers: "0",
      churnRate: "0.0%",
      mrr: "$0",
      selectedFeatures: [],
    } satisfies ServicePlan);
  const [form, setForm] = useState<ServicePlan>(initialPlan);

  function updateForm(field: keyof ServicePlan, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function toggleFeature(feature: string) {
    if (isView) {
      return;
    }

    setForm((currentForm) => {
      const selected = currentForm.selectedFeatures.includes(feature);

      return {
        ...currentForm,
        selectedFeatures: selected
          ? currentForm.selectedFeatures.filter((item) => item !== feature)
          : [...currentForm.selectedFeatures, feature],
      };
    });
  }

  function handleSave() {
    const cleanedName = form.name.trim() || "Untitled Plan";
    const generatedId = cleanedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = isAdd || form.id === "new-plan" ? generatedId : form.id;

    onSave({
      ...form,
      id: id || "untitled-plan",
      name: cleanedName,
      userCount:
        form.userLimit === "Unlimited"
          ? "0 accounts"
          : `${Number(form.userLimit || 0).toLocaleString()} users`,
    });
  }

  const title = isAdd
    ? "Add Service Plan"
    : isView
      ? "View Service Plan"
      : "Edit Service Plan";
  const subtitle = isAdd
    ? "Create the main information, resource limits, and included features for a new plan."
    : isView
      ? "Review plan details and limits. This view is locked from editing."
      : "Modify the details and limits for this service plan. Changes will take effect for new subscribers immediately.";
  const subscriberCount = Number(form.activeSubscribers.replace(/,/g, "")) || 0;
  const subscriberProgress = subscriberCount > 0 ? 75 : 0;
  const primaryActionLabel = isView
    ? "Edit Plan"
    : isAdd
      ? "Save New Plan"
      : "Save Plan Changes";
  const secondaryActionLabel = isView ? "Back to Plans" : "Cancel & Discard";
  const pricePrefix = form.price === "Custom" ? undefined : "$";

  return (
    <section className="w-full">
      <div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Back to service plans"
            title="Back"
            onClick={onCancel}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D7DDD5] bg-white text-[#46624E] transition hover:bg-[#F2F4EE]"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={22}
              strokeWidth={1.8}
            />
          </button>
          <h1 className="text-[24px] font-bold leading-tight text-[#172235] sm:text-[30px]">
            {title}
          </h1>
        </div>
        <p className="mt-3 max-w-[760px] text-[14px] font-medium leading-6 text-[#626A64]">
          {subtitle}
        </p>
      </div>

      <div className="mt-7 grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,308px)] xl:items-start">
        <div className="space-y-6">
          <PlanFormSection
            className="min-h-[334px]"
            contentClassName="gap-x-4 gap-y-4"
            title="Basic Info"
            icon={Invoice01Icon}
          >
            <PlanTextField
              className="sm:col-span-2"
              label="Plan Name"
              readOnly={isView}
              value={form.name}
              onChange={(value) => updateForm("name", value)}
            />
            <PlanTextField
              hint="Nominal fee between $2.00 - $3.00"
              label="Monthly Price (USD)"
              prefix={pricePrefix}
              readOnly={isView}
              value={form.price}
              onChange={(value) => updateForm("price", value)}
            />
            <PlanSelectField
              label="Billing Cycle"
              options={["Weekly", "Monthly", "Yearly"]}
              readOnly={isView}
              value={form.billingCycle}
              onChange={(value) => updateForm("billingCycle", value)}
            />
          </PlanFormSection>

          <PlanFormSection
            className="min-h-[212px]"
            contentClassName="gap-x-4"
            title="Usage Limits"
            icon={DatabaseIcon}
          >
            <PlanTextField
              label="Storage Limit (GB)"
              readOnly={isView}
              suffix="GB"
              value={form.storageLimit}
              onChange={(value) => updateForm("storageLimit", value)}
            />
            <PlanTextField
              label="User Count Limit"
              readOnly={isView}
              suffix="users"
              value={form.userLimit}
              onChange={(value) => updateForm("userLimit", value)}
            />
          </PlanFormSection>
        </div>

        <aside className="space-y-6">
          <section className="min-h-[236px] rounded-[16px] border border-[rgba(194,200,192,0.3)] bg-white p-8">
            <h2 className="text-[20px] font-medium leading-[30px] text-[#111C2D]">
              Plan Health
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4 text-[13px] leading-5">
                  <span className="font-normal text-[#424843]">
                    Active Subscribers
                  </span>
                  <span className="font-bold text-[#111C2D]">
                    {form.activeSubscribers}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E8EEFF]">
                  <div
                    className="h-full rounded-full bg-[#46624E]"
                    style={{ width: `${subscriberProgress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <PlanHealthMini label="Churn Rate" value={form.churnRate} />
                <PlanHealthMini label="MRR" value={form.mrr} />
              </div>
            </div>
          </section>

          <div className="space-y-3">
            <button
              type="button"
              onClick={isView ? () => onEdit(form) : handleSave}
              className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#46624E] px-4 text-center text-[16px] font-bold leading-6 text-white shadow-[0_10px_15px_-3px_rgba(70,98,78,0.1),0_4px_6px_-4px_rgba(70,98,78,0.1)] transition hover:bg-[#3C5544]"
            >
              {primaryActionLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-[58px] w-full items-center justify-center rounded-[12px] border border-[#C2C8C0] bg-[#F9F9FF] px-4 text-center text-[16px] font-medium leading-6 text-[#424843] transition hover:bg-[#F2F4EE]"
            >
              {secondaryActionLabel}
            </button>
            <p className="px-4 pt-2 text-center text-[13px] font-normal leading-5 text-[#424843]">
              Last edited by Alex Thorne on Oct 24, 2023. This action will be
              logged in the system audit trail.
            </p>
          </div>
        </aside>

        <PlanFormSection
          badge={`${form.selectedFeatures.length} Selected`}
          className="min-h-[403px] xl:col-span-2"
          contentClassName="gap-3 sm:grid-cols-2"
          icon={CheckmarkCircle02Icon}
          title="Features Multi-Select"
        >
          {planFeatureOptions.map((feature) => {
            const selected = form.selectedFeatures.includes(feature);

            return (
              <button
                key={feature}
                type="button"
                disabled={isView}
                onClick={() => toggleFeature(feature)}
                className={`flex min-h-[58px] items-center gap-3 rounded-[12px] border px-[15px] py-4 text-left text-[16px] font-normal leading-6 text-[#111C2D] transition disabled:cursor-default ${
                  selected
                    ? "border-[#46624E] bg-[rgba(94,123,101,0.05)]"
                    : "border-[#C2C8C0] bg-white"
                }`}
              >
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded ${
                    selected
                      ? "bg-[#46624E] text-white"
                      : "border border-[#727972] bg-white text-transparent"
                  }`}
                >
                  <HugeiconsIcon
                    icon={CheckmarkSquare01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </span>
                <span className="min-w-0">{feature}</span>
              </button>
            );
          })}
        </PlanFormSection>
      </div>

    </section>
  );
}
