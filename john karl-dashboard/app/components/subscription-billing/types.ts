export type ServicePlan = {
  id: string;
  name: string;
  price: string;
  billingCycle: string;
  storageLimit: string;
  userLimit: string;
  userCount: string;
  conversionRate: string;
  activeSubscribers: string;
  churnRate: string;
  mrr: string;
  selectedFeatures: string[];
};

export type PlanEditorMode = "add" | "edit" | "view";
