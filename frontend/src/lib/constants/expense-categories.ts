import {
  Home,
  ShoppingCart,
  Car,
  Zap,
  Heart,
  GraduationCap,
  HandHeart,
  Film,
  UtensilsCrossed,
  CreditCard,
  ShoppingBag,
  Sparkles,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface ExpenseCategoryConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  bucket: "needs" | "wants";
  is_essential: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  // Needs (is_essential: true)
  { key: "housing", label: "Housing", icon: Home, bucket: "needs", is_essential: true },
  { key: "food", label: "Food", icon: ShoppingCart, bucket: "needs", is_essential: true },
  { key: "transport", label: "Transport", icon: Car, bucket: "needs", is_essential: true },
  { key: "utilities", label: "Utilities", icon: Zap, bucket: "needs", is_essential: true },
  { key: "healthcare", label: "Healthcare", icon: Heart, bucket: "needs", is_essential: true },
  { key: "education", label: "Education", icon: GraduationCap, bucket: "needs", is_essential: true },
  { key: "zakat", label: "Zakat", icon: HandHeart, bucket: "needs", is_essential: true },

  // Wants (is_essential: false)
  { key: "entertainment", label: "Entertainment", icon: Film, bucket: "wants", is_essential: false },
  { key: "dining", label: "Dining", icon: UtensilsCrossed, bucket: "wants", is_essential: false },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard, bucket: "wants", is_essential: false },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, bucket: "wants", is_essential: false },
  { key: "personal_care", label: "Personal Care", icon: Sparkles, bucket: "wants", is_essential: false },
  { key: "other", label: "Other", icon: MoreHorizontal, bucket: "wants", is_essential: false },
];

export const NEEDS_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.bucket === "needs");
export const WANTS_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.bucket === "wants");

export function getCategoryConfig(key: string): ExpenseCategoryConfig | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.key === key);
}
