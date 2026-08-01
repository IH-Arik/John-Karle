"use client";

import Image from "next/image";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AiSettingIcon,
  Alert01Icon,
  ArrowRight01Icon,
  BalanceScaleIcon,
  BookOpenTextIcon,
  BrainCogIcon,
  Briefcase01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare01Icon,
  CloudUploadIcon,
  Copy01Icon,
  CpuIcon,
  DatabaseSettingIcon,
  EyeIcon,
  FileEditIcon,
  HeartCheckIcon,
  LaptopIcon,
  LinkSquare02Icon,
  MailSetting01Icon,
  PlusSignIcon,
  RedoIcon,
  SaveIcon,
  Settings02Icon,
  Shield01Icon,
  SmartPhone01Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import {
  getApiErrorMessage,
  useCreateAdminEmailTemplateMutation,
  useDeleteAdminEmailTemplateMutation,
  useGetAdminEmailTemplateByIdQuery,
  useGetAdminEmailTemplatesQuery,
  useUpdateAdminEmailTemplateMutation,
} from "../../../lib/api";
import type { AdminEmailTemplate } from "../../../lib/types";

type Tab = "General" | "AI Settings" | "Email Templates";

export const DEFAULT_PLATFORM_LOGO = "/logo.png";
export const PLATFORM_LOGO_STORAGE_KEY = "lineage-platform-logo";
const CONFIGURATION_STORAGE_KEY = "lineage-configuration-settings";

const tabs: Tab[] = ["General", "AI Settings", "Email Templates"];
const maxLogoFileSize = 2 * 1024 * 1024;
const allowedLogoTypes = ["image/png", "image/svg+xml"];
type EmotionalTone = "Compassionate" | "Neutral" | "Professional";
type SafetyFilterKey = "piiRedaction" | "griefSensitivity" | "sensitiveContent";
type AiSettings = {
  strictness: number;
  emotionalTone: EmotionalTone;
  deepArchiveEnabled: boolean;
  contextNodes: string;
  safetyFilters: Record<SafetyFilterKey, boolean>;
};
type EmailTemplate = {
  id: string;
  icon: IconSvgElement;
  title: string;
  description: string;
  subject: string;
  content: string;
};
type EmailDraft = Pick<EmailTemplate, "title" | "subject" | "content">;

const defaultAiSettings: AiSettings = {
  strictness: 0.8,
  emotionalTone: "Compassionate",
  deepArchiveEnabled: true,
  contextNodes: "Standard (5 Nodes)",
  safetyFilters: {
    piiRedaction: true,
    griefSensitivity: true,
    sensitiveContent: true,
  },
};

const safetyFilterRows: Array<{ key: SafetyFilterKey; label: string }> = [
  { key: "piiRedaction", label: "Automated PII Redaction" },
  { key: "griefSensitivity", label: "Grief Sensitivity Mode" },
  { key: "sensitiveContent", label: "Block Sensitive Content" },
];

const integrations = [
  { initial: "S", name: "Stripe", status: "Connected", active: true },
  { initial: "O", name: "OpenAI", status: "Connected", active: true },
  { initial: "A", name: "AWS S3", status: "Auth Required", active: false },
];

const toneProfiles: Array<{
  icon: IconSvgElement;
  title: EmotionalTone;
  description: string;
}> = [
  {
    icon: HeartCheckIcon,
    title: "Compassionate",
    description: "Warm and empathetic tone, sensitive to legacy and memory.",
  },
  {
    icon: BalanceScaleIcon,
    title: "Neutral",
    description: "Balanced and objective reporting of historical facts.",
  },
  {
    icon: Briefcase01Icon,
    title: "Professional",
    description: "Formal, scholarly tone suitable for academic research.",
  },
];

const defaultEmailTemplateMetadata: Array<
  Pick<EmailTemplate, "id" | "icon" | "title" | "description">
> = [
  {
    id: "memory-anniversary",
    icon: MailSetting01Icon,
    title: "Memory Anniversary",
    description: "Sent every 1, 5, 10 years",
  },
  {
    id: "welcome-series",
    icon: HeartCheckIcon,
    title: "Welcome Series",
    description: "Onboarding for new descendants",
  },
  {
    id: "security-alert",
    icon: Shield01Icon,
    title: "Security Alert",
    description: "Vault access notifications",
  },
  {
    id: "family-invitation",
    icon: LinkSquare02Icon,
    title: "Family Invitation",
    description: "Join a lineage circle",
  },
];

const defaultTokens = [
  "[[User_Name]]",
  "[[Memory_Title]]",
  "[[Anniversary_Year]]",
  "[[Vault_Link]]",
  "[[Asset_Thumbnail]]",
];

const defaultEmailSubject =
  "A beautiful memory from [[Anniversary_Year]] years ago...";

const defaultEmailContent = `Dear [[User_Name]],

Time flows quickly, but some moments are carved in eternity. Today marks the [[Anniversary_Year]] anniversary of [[Memory_Title]].

We invite you to step back into the vault and relive this precious moment with your loved ones. Our AI has curated a high-fidelity restoration of the original media for this special occasion.

Warmly,
The Lineage Team`;

function getEmailTemplateIcon(templateId: string) {
  return (
    defaultEmailTemplateMetadata.find((template) => template.id === templateId)
      ?.icon ?? FileEditIcon
  );
}

function toEmailTemplateView(template: AdminEmailTemplate): EmailTemplate {
  return {
    id: template.id,
    icon: getEmailTemplateIcon(template.id),
    title: template.templateName,
    description: template.subjectLine,
    subject: template.subjectLine,
    content: template.content,
  };
}

export function ConfigureContent({
  platformLogo,
  onPlatformLogoChange,
}: {
  platformLogo: string;
  onPlatformLogoChange: (logoSrc: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
  const [emailTemplateDraft, setEmailTemplateDraft] = useState<EmailDraft | null>(
    null,
  );
  const [emailTokens, setEmailTokens] = useState(defaultTokens);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [templateSaveStatus, setTemplateSaveStatus] = useState<"idle" | "saved">(
    "idle",
  );
  const [templateMessage, setTemplateMessage] = useState("");
  const {
    data: emailTemplatesData,
    isLoading: isEmailTemplatesLoading,
    error: emailTemplatesError,
  } = useGetAdminEmailTemplatesQuery({ page: 1, limit: 100 });
  const [createEmailTemplateMutation, { isLoading: isCreatingEmailTemplate }] =
    useCreateAdminEmailTemplateMutation();
  const [updateEmailTemplateMutation, { isLoading: isUpdatingEmailTemplate }] =
    useUpdateAdminEmailTemplateMutation();
  const [deleteEmailTemplateMutation, { isLoading: isDeletingEmailTemplate }] =
    useDeleteAdminEmailTemplateMutation();
  const emailTemplatesState = useMemo(
    () => (emailTemplatesData?.templates ?? []).map(toEmailTemplateView),
    [emailTemplatesData?.templates],
  );
  const selectedEmailTemplateQueryArg = selectedEmailTemplateId || skipToken;
  const {
    data: selectedEmailTemplateData,
    isFetching: isSelectedEmailTemplateFetching,
    error: selectedEmailTemplateError,
  } = useGetAdminEmailTemplateByIdQuery(selectedEmailTemplateQueryArg);
  const selectedEmailTemplate = useMemo(() => {
    if (selectedEmailTemplateData?.template) {
      return toEmailTemplateView(selectedEmailTemplateData.template);
    }

    return (
      emailTemplatesState.find((template) => template.id === selectedEmailTemplateId) ??
      emailTemplatesState[0]
    );
  }, [
    emailTemplatesState,
    selectedEmailTemplateData?.template,
    selectedEmailTemplateId,
  ]);
  const templateDirty =
    selectedEmailTemplate !== undefined &&
    emailTemplateDraft !== null &&
    (emailTemplateDraft.title !== selectedEmailTemplate.title ||
      emailTemplateDraft.subject !== selectedEmailTemplate.subject ||
      emailTemplateDraft.content !== selectedEmailTemplate.content);

  useEffect(() => {
    const savedConfiguration = window.localStorage.getItem(
      CONFIGURATION_STORAGE_KEY,
    );

    if (!savedConfiguration) {
      return;
    }

    try {
      const parsed = JSON.parse(savedConfiguration) as {
        aiSettings?: Partial<AiSettings>;
        selectedEmailTemplateId?: string;
        emailTokens?: string[];
      };

      if (parsed.aiSettings) {
        setAiSettings({
          ...defaultAiSettings,
          ...parsed.aiSettings,
          safetyFilters: {
            ...defaultAiSettings.safetyFilters,
            ...parsed.aiSettings.safetyFilters,
          },
        });
      }

      if (parsed.emailTokens?.length) {
        setEmailTokens(parsed.emailTokens);
      }

      if (parsed.selectedEmailTemplateId) {
        setSelectedEmailTemplateId(parsed.selectedEmailTemplateId);
      }
    } catch {
      window.localStorage.removeItem(CONFIGURATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!emailTemplatesState.length) {
      setSelectedEmailTemplateId("");
      return;
    }

    const selectedTemplateStillExists = emailTemplatesState.some(
      (template) => template.id === selectedEmailTemplateId,
    );

    if (!selectedEmailTemplateId || !selectedTemplateStillExists) {
      setSelectedEmailTemplateId(emailTemplatesState[0].id);
    }
  }, [emailTemplatesState, selectedEmailTemplateId]);

  useEffect(() => {
    if (!selectedEmailTemplate) {
      setEmailTemplateDraft(null);
      return;
    }

    setEmailTemplateDraft({
      title: selectedEmailTemplate.title,
      subject: selectedEmailTemplate.subject,
      content: selectedEmailTemplate.content,
    });
    setTemplateSaveStatus("idle");
    setTemplateMessage("");
  }, [selectedEmailTemplate?.id, selectedEmailTemplate]);

  function updateAiSettings(update: Partial<AiSettings>) {
    setAiSettings((current) => ({ ...current, ...update }));
    setSaveStatus("idle");
  }

  function handlePlatformLogoChange(logoSrc: string) {
    onPlatformLogoChange(logoSrc);
    setSaveStatus("idle");
  }

  function updateSafetyFilter(key: SafetyFilterKey, enabled: boolean) {
    setAiSettings((current) => ({
      ...current,
      safetyFilters: {
        ...current.safetyFilters,
        [key]: enabled,
      },
    }));
    setSaveStatus("idle");
  }

  function updateEmailTemplateDraft(update: Partial<EmailDraft>) {
    setEmailTemplateDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, ...update } : currentDraft,
    );
    setTemplateSaveStatus("idle");
    setTemplateMessage("");
  }

  async function createEmailTemplate() {
    const templateNumber = emailTemplatesState.length + 1;

    try {
      const response = await createEmailTemplateMutation({
        templateName: `New Template ${templateNumber}`,
        subjectLine: "New email subject",
        content: `Dear [[User_Name]],

Write your new message here.

Warmly,
The Lineage Team`,
      }).unwrap();

      setSelectedEmailTemplateId(response.template.id);
      setTemplateSaveStatus("saved");
      setTemplateMessage("Template created successfully.");
    } catch (error) {
      setTemplateSaveStatus("idle");
      setTemplateMessage(
        getApiErrorMessage(error, "Email template could not be created."),
      );
    }
  }

  function createEmailToken(token: string) {
    if (!token || emailTokens.includes(token)) {
      return;
    }

    setEmailTokens((currentTokens) => [...currentTokens, token]);
    setSaveStatus("idle");
  }

  async function saveSelectedEmailTemplate() {
    if (!selectedEmailTemplateId || !emailTemplateDraft) {
      return;
    }

    try {
      await updateEmailTemplateMutation({
        templateId: selectedEmailTemplateId,
        templateName: emailTemplateDraft.title.trim(),
        subjectLine: emailTemplateDraft.subject.trim(),
        content: emailTemplateDraft.content.trim(),
      }).unwrap();

      setTemplateSaveStatus("saved");
      setTemplateMessage("Template saved successfully.");
    } catch (error) {
      setTemplateSaveStatus("idle");
      setTemplateMessage(
        getApiErrorMessage(error, "Email template could not be saved."),
      );
    }
  }

  async function deleteSelectedEmailTemplate() {
    if (!selectedEmailTemplateId) {
      return;
    }

    const nextTemplateId =
      emailTemplatesState.find((template) => template.id !== selectedEmailTemplateId)
        ?.id ?? "";

    try {
      const response = await deleteEmailTemplateMutation(
        selectedEmailTemplateId,
      ).unwrap();
      setSelectedEmailTemplateId(nextTemplateId);
      setTemplateSaveStatus("saved");
      setTemplateMessage(response.message);
    } catch (error) {
      setTemplateSaveStatus("idle");
      setTemplateMessage(
        getApiErrorMessage(error, "Email template could not be deleted."),
      );
    }
  }

  function handleSaveChanges() {
    window.localStorage.setItem(PLATFORM_LOGO_STORAGE_KEY, platformLogo);
    window.localStorage.setItem(
      CONFIGURATION_STORAGE_KEY,
      JSON.stringify({
        platformLogo,
        aiSettings,
        selectedEmailTemplateId,
        emailTokens,
        savedAt: new Date().toISOString(),
      }),
    );
    setSaveStatus("saved");
  }

  return (
    <section className="flex w-full flex-col items-start gap-8">
      <header className="flex w-full flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="[font-family:Manrope,Inter,sans-serif] text-[32px] font-semibold leading-[40px] tracking-[-0.64px] text-[#46624E]">
            Configure
          </h1>
          <p className="mt-1 text-[16px] font-normal leading-6 text-[#424843]">
            Fine-tune Lineage.AI platform environment and global AI intelligence
          preferences.
          </p>
        </div>
        {activeTab !== "Email Templates" ? (
          <button
            type="button"
            onClick={handleSaveChanges}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#46624E] px-8 text-[16px] font-bold leading-6 text-white shadow-[0_10px_15px_-3px_rgba(70,98,78,0.2),0_4px_6px_-4px_rgba(70,98,78,0.2)] transition hover:bg-[#3C5544] sm:w-auto"
          >
            <HugeiconsIcon icon={SaveIcon} size={18} strokeWidth={1.8} />
            {saveStatus === "saved" ? "Changes Saved" : "Save Changes"}
          </button>
        ) : null}
      </header>

      <nav className="flex w-full gap-8 overflow-x-auto border-b border-[rgba(194,200,192,0.3)]">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex h-[39px] shrink-0 items-start justify-center whitespace-nowrap pb-4 text-[14px] leading-5 ${
                isActive
                  ? "border-b-2 border-[#46624E] font-bold text-[#46624E]"
                  : "font-normal text-[#424843] transition hover:text-[#46624E]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {activeTab === "General" ? (
        <GeneralTab
          platformLogo={platformLogo}
          onPlatformLogoChange={handlePlatformLogoChange}
        />
      ) : activeTab === "AI Settings" ? (
        <AiSettingsTab
          settings={aiSettings}
          onSettingsChange={updateAiSettings}
          onSafetyFilterChange={updateSafetyFilter}
        />
      ) : (
        <EmailTemplatesTab
          templates={emailTemplatesState}
          selectedTemplateId={selectedEmailTemplateId}
          selectedTemplateDraft={emailTemplateDraft}
          tokens={emailTokens}
          isLoading={isEmailTemplatesLoading || isSelectedEmailTemplateFetching}
          isSaving={isCreatingEmailTemplate || isUpdatingEmailTemplate}
          isDeleting={isDeletingEmailTemplate}
          isDirty={templateDirty}
          statusMessage={templateMessage}
          errorMessage={
            emailTemplatesError || selectedEmailTemplateError
              ? getApiErrorMessage(
                  emailTemplatesError ?? selectedEmailTemplateError,
                  "Email templates could not be loaded.",
                )
              : ""
          }
          onTemplateSelect={setSelectedEmailTemplateId}
          onTemplateCreate={createEmailTemplate}
          onTemplateChange={updateEmailTemplateDraft}
          onTemplateSave={saveSelectedEmailTemplate}
          onTemplateDelete={deleteSelectedEmailTemplate}
          onTokenCreate={createEmailToken}
        />
      )}
    </section>
  );
}

function GeneralTab({
  platformLogo,
  onPlatformLogoChange,
}: {
  platformLogo: string;
  onPlatformLogoChange: (logoSrc: string) => void;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoMessage, setLogoMessage] = useState("Maximum file size: 2MB.");
  const [logoError, setLogoError] = useState(false);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const hasAllowedType =
      allowedLogoTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(".png") ||
      file.name.toLowerCase().endsWith(".svg");

    if (!hasAllowedType) {
      setLogoMessage("Please choose a PNG or SVG logo.");
      setLogoError(true);
      event.target.value = "";
      return;
    }

    if (file.size > maxLogoFileSize) {
      setLogoMessage("Logo must be 2MB or smaller.");
      setLogoError(true);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLogoMessage("Could not read that logo file.");
        setLogoError(true);
        event.target.value = "";
        return;
      }

      onPlatformLogoChange(reader.result);
      window.localStorage.setItem(PLATFORM_LOGO_STORAGE_KEY, reader.result);
      setLogoMessage(file.name);
      setLogoError(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setLogoMessage("Could not read that logo file.");
      setLogoError(true);
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,328px)]">
      <div className="space-y-8">
        <ConfigCard title="General Configuration" icon={Settings02Icon}>
          <SettingRow
            label="Platform Name"
            description="The public-facing name of your instance."
          >
            <input
              value="Lineage.AI"
              readOnly
              className="h-12 w-full rounded-[12px] bg-[#F5F2EB] px-4 text-[16px] font-normal leading-[19px] text-[#111C2D] outline-none"
            />
          </SettingRow>

          <SettingRow
            label="Platform Logo"
            description="SVG or PNG format. Recommended 512x512px."
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] border-2 border-dashed border-[rgba(70,98,78,0.2)] bg-[#CAEAD5]">
                <img
                  src={platformLogo}
                  alt="Lineage.AI logo preview"
                  className="h-10 w-10 object-contain opacity-60"
                />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,.png,.svg"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-[42px] items-center gap-2 rounded-[12px] border border-[#C2C8C0] bg-white px-4 text-[14px] font-semibold leading-5 text-[#111C2D] transition hover:bg-[#F5F2EB]"
                >
                  <HugeiconsIcon
                    icon={CloudUploadIcon}
                    size={16}
                    strokeWidth={1.8}
                    className="text-[#46624E]"
                  />
                  Choose New Logo
                </button>
                <p
                  className={`mt-2 text-[10px] font-normal leading-[15px] ${
                    logoError ? "text-[#C84B4B]" : "text-[#424843]"
                  }`}
                >
                  {logoMessage}
                </p>
              </div>
            </div>
          </SettingRow>

          <div className="grid gap-6 border-t border-[rgba(194,200,192,0.1)] pt-6 sm:grid-cols-2">
            <LabeledSelect
              label="Default Timezone"
              value="Pacific Standard Time (PST)"
            />
            <LabeledSelect label="Default Language" value="English (US)" />
          </div>
        </ConfigCard>

        <ConfigCard
          title="AI Logic & Constraints"
          icon={BrainCogIcon}
          badge="Advanced Feature"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[16px] font-bold leading-6 text-[#46624E]">
                Response Grounding Strictness
              </p>
              <p className="text-[16px] font-bold leading-6 text-[#46624E]">
                High (0.8)
              </p>
            </div>
            <div className="h-2 rounded-lg bg-[#CAEAD5]" />
            <div className="flex justify-between text-[10px] font-normal uppercase leading-[15px] tracking-[-0.5px] text-[#424843]">
              <span>Creative</span>
              <span>Strict (Fact-Only)</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AiOptionCard
              icon={DatabaseSettingIcon}
              title="Memory Retrieval Depth"
              description="How many historical context nodes the AI pulls per query."
              value="Standard (5 Nodes)"
            />
            <AiOptionCard
              icon={Shield01Icon}
              title="Content Filtering"
              description="Safety protocol level for sensitive genealogical data."
              value="Institutional Grade"
            />
          </div>
        </ConfigCard>
      </div>

      <aside className="space-y-8">
        <SystemIntegrityCard />
        <IntegrationCard />
        <KnowledgeCard />
      </aside>
    </div>
  );
}

function AiSettingsTab({
  settings,
  onSettingsChange,
  onSafetyFilterChange,
}: {
  settings: AiSettings;
  onSettingsChange: (update: Partial<AiSettings>) => void;
  onSafetyFilterChange: (key: SafetyFilterKey, enabled: boolean) => void;
}) {
  const strictnessPercent = Math.round(settings.strictness * 100);
  const strictnessLabel =
    settings.strictness >= 0.85
      ? "Strict"
      : settings.strictness >= 0.65
        ? "High"
        : settings.strictness >= 0.35
          ? "Balanced"
          : "Creative";

  return (
    <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,328px)]">
      <div className="space-y-8">
        <AiSettingsCard
          title="Grounding & Strictness"
          icon={AiSettingIcon}
          description="Define how strictly the AI adheres to genealogical data."
          badge="Advanced Feature"
          iconClassName="bg-[#E9DDFD] text-[#4B435C]"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-[16px] uppercase leading-6 text-[#424843]">
              <span>Creative Narrative</span>
              <span className="font-bold text-[#46624E]">
                {strictnessLabel} ({settings.strictness.toFixed(2)} Strictness)
              </span>
              <span>Strict Fact-Only</span>
            </div>

            <div className="relative h-6">
              <input
                aria-label="Response grounding strictness"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.strictness}
                onChange={(event) =>
                  onSettingsChange({
                    strictness: Number(event.currentTarget.value),
                  })
                }
                className="strictness-range absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none rounded-full outline-none"
                style={{
                  background: `linear-gradient(to right, #46624E 0%, #46624E ${strictnessPercent}%, #DDE5DA ${strictnessPercent}%, #DDE5DA 100%)`,
                }}
              />
            </div>

            <div className="flex items-start gap-3 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] leading-5 text-[#92400E]">
              <HugeiconsIcon
                icon={Alert01Icon}
                size={20}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0 text-[#D97706]"
              />
              <p>
                <span className="font-bold">High strictness</span> reduces
                hallucinations but may result in less engaging narrative
                generation. Ideal for formal family reports.
              </p>
            </div>
          </div>
        </AiSettingsCard>

        <AiSettingsCard title="Emotional Tone Profile">
          <div className="grid gap-4 md:grid-cols-3">
            {toneProfiles.map((profile) => (
              <ToneCard
                key={profile.title}
                {...profile}
                active={profile.title === settings.emotionalTone}
                onSelect={() => onSettingsChange({ emotionalTone: profile.title })}
              />
            ))}
          </div>
        </AiSettingsCard>

        <div className="grid gap-8 lg:grid-cols-2">
          <AiSettingsCard
            title="Retrieval Depth"
            icon={DatabaseSettingIcon}
            compact
          >
            <ToggleRow
              title="Deep Archive Search"
              description="Access older historical nodes"
              enabled={settings.deepArchiveEnabled}
              onToggle={() =>
                onSettingsChange({
                  deepArchiveEnabled: !settings.deepArchiveEnabled,
                })
              }
            />
            <CompactSelect
              label="Context Nodes per Query"
              value={settings.contextNodes}
              onChange={(contextNodes) => onSettingsChange({ contextNodes })}
            />
          </AiSettingsCard>

          <AiSettingsCard
            title="Safety & Filtering"
            icon={Shield01Icon}
            iconClassName="text-[#BA1A1A]"
            compact
          >
            {safetyFilterRows.map((row) => (
              <CheckRow
                key={row.key}
                label={row.label}
                checked={settings.safetyFilters[row.key]}
                onChange={(checked) => onSafetyFilterChange(row.key, checked)}
              />
            ))}
          </AiSettingsCard>
        </div>
      </div>

      <aside className="space-y-8">
        <SystemIntegrityCard />
        <KnowledgeCard />
        <ResourceUsageCard />
      </aside>
    </div>
  );
}

function normalizeTokenName(value: string) {
  const trimmedValue = value.trim();

  if (/^\[\[[A-Za-z0-9_]+\]\]$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const tokenName = trimmedValue
    .replace(/^\[\[|\]\]$/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return tokenName ? `[[${tokenName}]]` : "";
}

function EmailTemplatesTab({
  templates,
  selectedTemplateId,
  selectedTemplateDraft,
  tokens,
  isLoading,
  isSaving,
  isDeleting,
  isDirty,
  statusMessage,
  errorMessage,
  onTemplateSelect,
  onTemplateCreate,
  onTemplateChange,
  onTemplateSave,
  onTemplateDelete,
  onTokenCreate,
}: {
  templates: EmailTemplate[];
  selectedTemplateId: string;
  selectedTemplateDraft: EmailDraft | null;
  tokens: string[];
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isDirty: boolean;
  statusMessage: string;
  errorMessage: string;
  onTemplateSelect: (templateId: string) => void;
  onTemplateCreate: () => Promise<void>;
  onTemplateChange: (update: Partial<EmailDraft>) => void;
  onTemplateSave: () => Promise<void>;
  onTemplateDelete: () => Promise<void>;
  onTokenCreate: (token: string) => void;
}) {
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0];
  const selectedDraft = selectedTemplateDraft ?? {
    title: selectedTemplate?.title ?? "",
    subject: selectedTemplate?.subject ?? "",
    content: selectedTemplate?.content ?? "",
  };
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<{
    past: EmailDraft[];
    future: EmailDraft[];
  }>({ past: [], future: [] });
  const [newTokenName, setNewTokenName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setHistory({ past: [], future: [] });
    setPreviewOpen(false);

    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [selectedTemplate?.id]);

  function captureCurrentDraft() {
    if (!selectedTemplate) {
      return;
    }

    setHistory((currentHistory) => ({
      past: [
        ...currentHistory.past,
        {
          title: selectedDraft.title,
          subject: selectedDraft.subject,
          content: selectedDraft.content,
        },
      ],
      future: [],
    }));
  }

  function updateSelectedTemplate(update: Partial<EmailDraft>) {
    captureCurrentDraft();
    onTemplateChange(update);
  }

  function insertToken(token: string, textarea = contentRef.current) {
    const insertionTarget = textarea;
    const selectionStart =
      insertionTarget?.selectionStart ?? selectedDraft.content.length;
    const selectionEnd =
      insertionTarget?.selectionEnd ?? selectedDraft.content.length;
    const nextContent = `${selectedDraft.content.slice(
      0,
      selectionStart,
    )}${token}${selectedDraft.content.slice(selectionEnd)}`;
    const nextCursorPosition = selectionStart + token.length;

    updateSelectedTemplate({ content: nextContent });

    window.requestAnimationFrame(() => {
      insertionTarget?.focus();
      insertionTarget?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function handleTokenDrop(event: DragEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    const token = event.dataTransfer.getData("text/plain");

    if (token) {
      insertToken(token, event.currentTarget);
    }
  }

  function handleCreateToken() {
    const token = normalizeTokenName(newTokenName);

    if (!token) {
      return;
    }

    onTokenCreate(token);
    setNewTokenName("");
  }

  function handleUndo() {
    const previousDraft = history.past.at(-1);

    if (!previousDraft || !selectedTemplate) {
      return;
    }

    setHistory((currentHistory) => ({
      past: currentHistory.past.slice(0, -1),
      future: [
        {
          title: selectedDraft.title,
          subject: selectedDraft.subject,
          content: selectedDraft.content,
        },
        ...currentHistory.future,
      ],
    }));
    onTemplateChange(previousDraft);
  }

  function handleRedo() {
    const nextDraft = history.future[0];

    if (!nextDraft || !selectedTemplate) {
      return;
    }

    setHistory((currentHistory) => ({
      past: [
        ...currentHistory.past,
        {
          title: selectedDraft.title,
          subject: selectedDraft.subject,
          content: selectedDraft.content,
        },
      ],
      future: currentHistory.future.slice(1),
    }));
    onTemplateChange(nextDraft);
  }

  return (
    <div className="grid w-full gap-6 xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-5 shadow-[0_4px_20px_rgba(109,139,116,0.05)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-[20px] font-medium leading-[30px] text-[#111C2D]">
              <HugeiconsIcon icon={BookOpenTextIcon} size={20} strokeWidth={1.8} />
              Template Library
            </h2>
            <button
              type="button"
              aria-label="Add template"
              onClick={onTemplateCreate}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#46624E] transition hover:bg-[#F5F2EB]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="rounded-[12px] border border-[#D9DDD6] bg-[#F7F8FB] px-4 py-5 text-[13px] font-medium text-[#6B7280]">
                Loading templates...
              </p>
            ) : templates.length === 0 ? (
              <p className="rounded-[12px] border border-[#D9DDD6] bg-[#F7F8FB] px-4 py-5 text-[13px] font-medium text-[#6B7280]">
                No email templates yet. Create one to start building reusable campaigns.
              </p>
            ) : (
              templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  active={template.id === selectedTemplate?.id}
                  onSelect={() => onTemplateSelect(template.id)}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-5 shadow-[0_4px_20px_rgba(109,139,116,0.05)]">
          <h2 className="mb-4 flex items-center gap-2 text-[20px] font-medium leading-[30px] text-[#111C2D]">
            <HugeiconsIcon icon={Copy01Icon} size={18} strokeWidth={1.8} />
            Tokens
          </h2>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token) => (
              <button
                key={token}
                type="button"
                draggable
                onClick={() => insertToken(token)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("text/plain", token);
                }}
                className="rounded-full border border-[#C2C8C0] bg-[#F0F3FF] px-3 py-1 font-mono text-[13px] font-normal leading-5 text-[#46624E] transition hover:bg-[#DDE6F3]"
              >
                {token}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={newTokenName}
              onChange={(event) => setNewTokenName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateToken();
                }
              }}
              placeholder="[[New_Token]]"
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#DCE0D8] bg-[#FAFAF7] px-3 font-mono text-[12px] text-[#111C2D] outline-none transition focus:border-[#46624E]"
            />
            <button
              type="button"
              aria-label="Create token"
              onClick={handleCreateToken}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#46624E] text-white transition hover:bg-[#3C5544]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.8} />
            </button>
          </div>
        </section>
      </div>

      <section className="grid overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white shadow-[0_4px_20px_rgba(109,139,116,0.05)] lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold leading-6 text-[#111C2D]">
              <HugeiconsIcon icon={FileEditIcon} size={18} strokeWidth={1.8} />
              Editing: {selectedDraft.title || "Untitled Template"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void onTemplateSave()}
                disabled={!selectedTemplate || !isDirty || isSaving || isDeleting}
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#46624E] px-3 text-[13px] font-semibold text-white transition hover:bg-[#3C5544] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={SaveIcon} size={16} strokeWidth={1.8} />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void onTemplateDelete()}
                disabled={!selectedTemplate || isSaving || isDeleting}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#E7D7D7] bg-white px-3 text-[13px] font-semibold text-[#A63C3C] transition hover:bg-[#FFF8F8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <IconButton
                icon={UndoIcon}
                label="Undo"
                disabled={history.past.length === 0}
                onClick={handleUndo}
              />
              <IconButton
                icon={RedoIcon}
                label="Redo"
                disabled={history.future.length === 0}
                onClick={handleRedo}
              />
              <IconButton
                icon={EyeIcon}
                label="Preview"
                onClick={() => setPreviewOpen(true)}
              />
            </div>
          </div>

          <label className="block">
            <span className="text-[13px] font-semibold leading-5 text-[#424843]">
              Template Name
            </span>
            <input
              ref={titleInputRef}
              value={selectedDraft.title}
              placeholder="Untitled Template"
              onChange={(event) =>
                onTemplateChange({
                  title: event.currentTarget.value,
                })
              }
              disabled={!selectedTemplate}
              className="mt-2 h-11 w-full rounded-lg border border-[#DCE0D8] bg-[#FAFAF7] px-4 text-[16px] font-normal leading-6 text-[#111C2D] outline-none transition focus:border-[#46624E]"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-[13px] font-semibold leading-5 text-[#424843]">
              Subject Line
            </span>
            <textarea
              value={selectedDraft.subject}
              onChange={(event) =>
                updateSelectedTemplate({ subject: event.currentTarget.value })
              }
              disabled={!selectedTemplate}
              className="mt-2 h-16 w-full resize-none rounded-lg border border-[#DCE0D8] bg-[#FAFAF7] px-4 py-3 text-[16px] font-normal leading-6 text-[#111C2D] outline-none transition focus:border-[#46624E]"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-[13px] font-semibold leading-5 text-[#424843]">
              Email Content
            </span>
            <textarea
              ref={contentRef}
              value={selectedDraft.content}
              onChange={(event) =>
                updateSelectedTemplate({ content: event.currentTarget.value })
              }
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleTokenDrop}
              disabled={!selectedTemplate}
              className="mt-2 min-h-[360px] w-full resize-none rounded-lg border border-[#DCE0D8] bg-[#FAFAF7] px-4 py-4 font-serif text-[18px] font-normal leading-[29px] text-[#111C2D] outline-none transition focus:border-[#46624E]"
            />
          </label>

          {errorMessage ? (
            <p className="mt-4 rounded-[12px] border border-[#E7D7D7] bg-[#FFF8F8] px-4 py-3 text-[13px] font-medium text-[#A63C3C]">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="mt-4 rounded-[12px] border border-[#D7E9DA] bg-[#F5FBF6] px-4 py-3 text-[13px] font-medium text-[#46624E]">
              {statusMessage}
            </p>
          ) : null}

          <div className="mt-4 rounded-[12px] bg-[#EEF7EF] p-4 text-[12px] leading-5 text-[#46624E]">
            <span className="font-bold">AI Suggestion:</span> Adding a
            call-to-action button here increases engagement by 24% for ancestry
            accounts.
          </div>
        </div>

        <div className="flex flex-col items-center bg-[#EEF3FF] p-5">
          <EmailPreview
            subject={selectedDraft.subject}
            content={selectedDraft.content}
          />
          <div className="mt-4 flex items-center gap-3 text-[#8B96A3]">
            <HugeiconsIcon icon={SmartPhone01Icon} size={18} strokeWidth={1.8} />
            <HugeiconsIcon icon={LaptopIcon} size={18} strokeWidth={1.8} />
          </div>
        </div>
      </section>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111C2D]/45 p-4">
          <div className="max-h-[90vh] overflow-y-auto rounded-[20px] bg-[#EEF3FF] p-5 shadow-[0_24px_70px_rgba(17,28,45,0.28)]">
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#46624E] transition hover:bg-[#F5F2EB]"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>
            <EmailPreview
              subject={selectedDraft.subject}
              content={selectedDraft.content}
              wide
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConfigCard({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: IconSvgElement;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 shadow-[0_4px_20px_rgba(109,139,116,0.05)] sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#CAEAD5] text-[#46624E]">
            <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
          </span>
          <h2 className="[font-family:Manrope,Inter,sans-serif] text-[20px] font-medium leading-7 text-[#46624E]">
            {title}
          </h2>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full bg-[rgba(70,98,78,0.1)] px-3 py-1 text-[12px] font-bold leading-4 text-[#46624E]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function AiSettingsCard({
  title,
  icon,
  description,
  badge,
  iconClassName = "bg-[#CAEAD5] text-[#46624E]",
  compact = false,
  children,
}: {
  title: string;
  icon?: IconSvgElement;
  description?: string;
  badge?: string;
  iconClassName?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-[16px] border border-[#E8EEFF] bg-white shadow-[0_4px_20px_rgba(63,91,75,0.05)] ${
        compact ? "p-8" : "p-8"
      }`}
    >
      {icon || description || badge ? (
        <div
          className={`mb-8 flex gap-5 ${
            badge
              ? "flex-col sm:flex-row sm:items-center sm:justify-between"
              : "items-center"
          }`}
        >
          <div className="flex min-w-0 items-center gap-4">
            {icon ? (
              <span
                className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-[12px] ${iconClassName}`}
              >
                <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-[20px] font-medium leading-[30px] text-[#111C2D]">
                {title}
              </h2>
              {description ? (
                <p className="mt-0 text-[16px] font-normal leading-6 text-[#424843]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {badge ? (
            <span className="w-fit shrink-0 rounded-full border border-[#C2C8C0] bg-[#DFE8FF] px-3 py-1 text-[16px] font-normal leading-6 text-[#424843]">
              {badge}
            </span>
          ) : null}
        </div>
      ) : (
        <h2 className="mb-6 text-[20px] font-medium leading-[30px] text-[#111C2D]">
          {title}
        </h2>
      )}
      <div className={compact ? "space-y-6" : undefined}>{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[189px_minmax(0,1fr)] md:gap-6">
      <div>
        <p className="text-[16px] font-bold leading-6 text-[#46624E]">
          {label}
        </p>
        <p className="mt-1 text-[12px] font-normal leading-4 text-[#424843]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function LabeledSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[14px] font-bold leading-5 text-[#46624E]">
        {label}
      </span>
      <select
        defaultValue={value}
        className="mt-2 h-12 w-full rounded-[12px] border border-[rgba(194,200,192,0.3)] bg-[#F5F2EB] px-4 text-[14px] font-normal leading-6 text-[#111C2D] outline-none"
      >
        <option>{value}</option>
      </select>
    </label>
  );
}

function CompactSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[16px] font-normal leading-6 text-[#424843]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 h-[42px] w-full rounded-[12px] border border-[#C2C8C0] bg-[#F0F3FF] px-3 text-[15px] font-normal leading-6 text-[#111C2D] outline-none"
      >
        <option>Standard (5 Nodes)</option>
        <option>Extended (8 Nodes)</option>
        <option>Deep (12 Nodes)</option>
      </select>
    </label>
  );
}

function AiOptionCard({
  icon,
  title,
  description,
  value,
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] border border-[rgba(194,200,192,0.2)] bg-[#F0F3FF] p-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={icon}
          size={13}
          strokeWidth={1.8}
          className="text-[#46624E]"
        />
        <p className="text-[16px] font-bold leading-6 text-[#46624E]">
          {title}
        </p>
      </div>
      <p className="mt-2 min-h-10 text-[12px] font-normal leading-4 text-[#424843]">
        {description}
      </p>
      <select
        defaultValue={value}
        className="mt-2 h-[38px] w-full rounded-lg border border-[rgba(194,200,192,0.3)] bg-white px-2 text-[14px] font-normal leading-5 text-[#111C2D] outline-none"
      >
        <option>{value}</option>
      </select>
    </div>
  );
}

function ToneCard({
  icon,
  title,
  description,
  active,
  onSelect,
}: {
  icon: IconSvgElement;
  title: EmotionalTone;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`flex min-h-[298px] flex-col rounded-[16px] border p-[23px_24px_24px] text-left transition ${
        active
          ? "border-2 border-[#46624E] bg-[rgba(202,234,213,0.3)] text-[#46624E]"
          : "border-[#C2C8C0] bg-white text-[#424843] hover:border-[#46624E]"
      }`}
    >
      <HugeiconsIcon icon={icon} size={24} strokeWidth={1.8} />
      <span className="mt-4 text-[18px] font-normal leading-[27px] text-[#111C2D]">
        {title}
      </span>
      <span className="mt-1 text-[16px] font-normal leading-[26px] text-[#424843]">
        {description}
      </span>
      {active ? (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={20}
          strokeWidth={1.8}
          className="mt-auto self-end text-[#46624E]"
        />
      ) : null}
    </button>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-4">
      <div>
        <p className="text-[16px] font-semibold leading-6 text-[#111C2D]">
          {title}
        </p>
        <p className="text-[16px] font-normal leading-6 text-[#424843]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`flex h-6 w-10 shrink-0 items-center rounded-full p-1 transition ${
          enabled ? "justify-end bg-[#46624E]" : "justify-start bg-[#D9DDD6]"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </button>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-[11px] rounded-[12px] px-[11px] py-3 transition hover:bg-[#F5F7F4]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition ${
          checked
            ? "border-[#46624E] bg-[#46624E] text-white"
            : "border-[#AEB7AA] bg-white text-transparent"
        }`}
      >
        {checked ? (
          <HugeiconsIcon
            icon={CheckmarkSquare01Icon}
            size={14}
            strokeWidth={1.8}
          />
        ) : null}
      </span>
      <span className="text-[16px] font-normal leading-6 text-[#111C2D]">
        {label}
      </span>
    </label>
  );
}

function TemplateCard({
  icon,
  title,
  description,
  active,
  onSelect,
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-[12px] border p-4 text-left transition ${
        active
          ? "border-[#46624E] bg-[#CAEAD5]"
          : "border-[#D9DDD6] bg-[#F7F8FB] hover:border-[#46624E]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-[#46624E] text-white" : "bg-white text-[#6D7A69]"
        }`}
      >
        <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-5 text-[#46624E]">
          {title || "Untitled Template"}
        </span>
        <span className="block text-[11px] leading-4 text-[#424843]">
          {description}
        </span>
      </span>
      {active ? (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={18}
          strokeWidth={1.8}
          className="shrink-0 text-[#46624E]"
        />
      ) : null}
    </button>
  );
}

function IconButton({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#46624E] transition hover:bg-[#F5F2EB] disabled:cursor-not-allowed disabled:text-[#AAB1A8] disabled:hover:bg-transparent"
    >
      <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
    </button>
  );
}

function EmailPreview({
  subject,
  content,
  wide = false,
}: {
  subject: string;
  content: string;
  wide?: boolean;
}) {
  const previewSubject =
    subject.trim().length > 0
      ? subject
          .replaceAll("[[Anniversary_Year]]", "5th")
          .replaceAll("[[Memory_Title]]", "Summer Cabin Reunion")
      : defaultEmailSubject;
  const previewContent =
    content.trim().length > 0
      ? content
          .replaceAll("[[User_Name]]", "James")
          .replaceAll("[[Anniversary_Year]]", "5th")
          .replaceAll("[[Memory_Title]]", "Summer Cabin Reunion")
      : defaultEmailContent;

  return (
    <div
      className={`w-full overflow-hidden rounded-[24px] bg-white shadow-[0_22px_50px_rgba(70,98,78,0.18)] ${
        wide ? "max-w-[720px]" : "max-w-[240px]"
      }`}
    >
      <div className={`relative w-full ${wide ? "h-[220px]" : "h-[150px]"}`}>
        <Image
          src="/configure.png"
          alt="Memory anniversary email preview"
          fill
          sizes={wide ? "720px" : "240px"}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <h3
          className={`absolute bottom-5 left-5 right-5 font-semibold text-white ${
            wide
              ? "text-[32px] leading-[42px]"
              : "text-[24px] leading-[34px] tracking-[-0.24px]"
          }`}
        >
          {previewSubject}
        </h3>
      </div>
      <div
        className={`flex flex-col text-center ${
          wide ? "px-10 py-8" : "px-7 py-7"
        }`}
      >
        <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-[#46624E]" />
        <h4 className="text-[20px] font-medium leading-[30px] text-[#46624E]">
          A Moment Preserved
        </h4>
        <p className="mt-5 text-[16px] italic leading-[26px] text-[#424843]">
          Memory is a way of holding onto the things you love, the things you
          are, the things you never want to lose.
        </p>
        <div
          className={`mt-6 overflow-y-auto overflow-x-hidden pr-1 text-[16px] font-normal leading-8 text-[#111C2D] ${
            wide ? "max-h-[260px]" : "max-h-[136px]"
          }`}
        >
          {previewContent.split("\n").map((line, index) => (
            <p key={`${line}-${index}`} className={line ? "" : "h-4"}>
              {line}
            </p>
          ))}
        </div>
        <button
          type="button"
          className="relative z-10 mt-6 min-h-20 w-full shrink-0 rounded-full bg-[#46624E] px-8 py-4 text-[16px] font-semibold leading-6 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          Relive the Memory
        </button>
        <div className="mt-7 shrink-0 border-t border-[#C2C8C0] pt-6 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-[#727972]">
          Lineage.AI Sanctuary
        </div>
      </div>
    </div>
  );
}

function SystemIntegrityCard() {
  return (
    <section className="min-h-[226px] rounded-[16px] bg-[#46624E] p-6 text-white shadow-[0_4px_20px_rgba(63,91,75,0.05)]">
      <h2 className="flex items-center gap-2 text-[16px] font-normal leading-6">
        <HugeiconsIcon icon={CpuIcon} size={18} strokeWidth={1.8} />
        System Integrity
      </h2>
      <div className="mt-6 space-y-4">
        <StatusRow label="AI Latency" value="24ms" />
        <StatusRow label="Sync Status">
          <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase leading-4">
            Active
          </span>
        </StatusRow>
        <StatusRow label="Last Training" value="Today, 04:00 AM" compact />
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  compact,
  children,
}: {
  label: string;
  value?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0 last:pb-0">
      <span className="text-[16px] font-normal leading-6 text-white/80">
        {label}
      </span>
      {children ?? (
        <span
          className={`font-semibold text-white ${
            compact ? "text-[16px] leading-6" : "text-[16px] leading-6"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function IntegrationCard() {
  return (
    <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 shadow-[0_4px_20px_rgba(109,139,116,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[16px] font-bold leading-6 text-[#46624E]">
          Active Integrations
        </h2>
        <HugeiconsIcon
          icon={LinkSquare02Icon}
          size={18}
          strokeWidth={1.8}
          className="text-[#424843]"
        />
      </div>
      <div className="mt-6 space-y-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F2EB] text-[12px] font-bold leading-4 text-[#46624E]">
              {integration.initial}
            </span>
            <div>
              <p className="text-[14px] font-semibold leading-5 text-[#46624E]">
                {integration.name}
              </p>
              <p
                className={`text-[10px] font-bold uppercase leading-[15px] ${
                  integration.active ? "text-[#16A34A]" : "text-[#424843]"
                }`}
              >
                {integration.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KnowledgeCard() {
  return (
    <section className="min-h-[450px] overflow-hidden rounded-[16px] bg-white shadow-[0_4px_20px_rgba(63,91,75,0.05)]">
      <div className="relative h-[160px] w-full">
        <Image
          src="/configure.png"
          alt="Configuration knowledge base preview"
          fill
          sizes="328px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="min-h-[290px] p-6">
        <p className="text-[16px] font-normal uppercase leading-6 text-[#46624E]">
          Knowledge Base
        </p>
        <h2 className="mt-1 text-[16px] font-normal leading-6 text-[#111C2D]">
          Need help configuring AI?
        </h2>
        <p className="mt-2 text-[16px] font-normal leading-[26px] text-[#424843]">
          Visit our comprehensive documentation to learn more about advanced AI
          grounding and data privacy protocols for genealogical research.
        </p>
        <button
          type="button"
          className="mt-5 flex items-center gap-2 text-[16px] font-semibold leading-6 text-[#46624E]"
        >
          Explore Docs
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

function ResourceUsageCard() {
  return (
    <section className="rounded-[16px] border border-[#CFD8F5] bg-[#EDF2FF] p-5 shadow-[0_4px_20px_rgba(109,139,116,0.05)]">
      <p className="text-[12px] font-bold uppercase leading-4 tracking-[1px] text-[#7C8793]">
        AI Resource Usage
      </p>
      <Meter label="Tokens Remaining" value="78%" width="78%" />
      <Meter label="Processing Load" value="12%" width="12%" />
    </section>
  );
}

function Meter({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-bold leading-4 text-[#46624E]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white">
        <div className="h-full rounded-full bg-[#46624E]" style={{ width }} />
      </div>
    </div>
  );
}
