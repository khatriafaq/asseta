import {
  Briefcase,
  Code,
  Home,
  TrendingUp,
  Banknote,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface IncomeSourceConfig {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const INCOME_SOURCES: IncomeSourceConfig[] = [
  { key: "salary", label: "Salary", icon: Briefcase },
  { key: "freelance", label: "Freelance", icon: Code },
  { key: "rental", label: "Rental", icon: Home },
  { key: "dividends", label: "Dividends", icon: TrendingUp },
  { key: "profit", label: "Profit", icon: Banknote },
  { key: "business", label: "Business", icon: Building2 },
];

export function getSourceConfig(key: string): IncomeSourceConfig | undefined {
  return INCOME_SOURCES.find((s) => s.key === key);
}
