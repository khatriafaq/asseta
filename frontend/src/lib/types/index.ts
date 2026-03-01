// ─── Auth ────────────────────────────────────────────────────

export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export interface User {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
  date_of_birth: string | null;
  risk_tolerance: RiskTolerance | null;
  investment_horizon_years: number | null;
  monthly_income: number | null;
  gemini_api_key_masked: string | null;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  date_of_birth?: string;
  risk_tolerance?: RiskTolerance;
  investment_horizon_years?: number;
  monthly_income?: number;
  gemini_api_key?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

// ─── Portfolio ────────────────────────────────────────────────

export interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreate {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface PortfolioUpdate {
  name?: string;
  description?: string;
  is_default?: boolean;
}

// ─── Holding ──────────────────────────────────────────────────

export interface Holding {
  id: number;
  portfolio_id: number;
  fund_id: number;
  units_held: number;
  total_invested: number;
  avg_cost_per_unit: number;
  current_value: number;
  gain_loss: number;
  return_pct: number;
  updated_at: string;
  fund_name: string | null;
  fund_type: string | null;
  institution_name: string | null;
  current_nav: number | null;
  nav_change: number | null;
}

export interface HoldingGroup {
  institution?: string;
  asset_type?: string;
  total_invested: number;
  current_value: number;
  gain_loss: number;
}

// ─── Transaction ──────────────────────────────────────────────

export interface Transaction {
  id: number;
  portfolio_id: number;
  fund_id: number;
  date: string;
  transaction_type: string;
  units: number;
  price_per_unit: number;
  amount: number;
  signed_amount: number;
  xirr_cashflow: number;
  created_at: string;
  fund_name: string | null;
  institution_name: string | null;
}

export interface TransactionCreate {
  fund_id: number;
  date: string;
  transaction_type: string;
  units: number;
  price_per_unit: number;
  amount: number;
  signed_amount?: number;
  xirr_cashflow?: number;
}

export interface TransactionUpdate {
  date?: string;
  transaction_type?: string;
  units?: number;
  price_per_unit?: number;
  amount?: number;
}

export interface ImportSummary {
  institutions: number;
  categories: number;
  funds: number;
  transactions: number;
  manual_assets: number;
  target_allocations: number;
}

// ─── Fund ─────────────────────────────────────────────────────

export interface FundCreate {
  scheme_key: string;
  name: string;
  fund_type: string;
  is_shariah_compliant?: boolean;
}

export interface FundBrief {
  id: number;
  scheme_key: string;
  name: string;
  fund_type: string;
  current_nav: number | null;
  return_ytd: number | null;
  is_shariah_compliant: boolean;
}

export interface Fund extends FundBrief {
  category_id: number | null;
  institution_id: number | null;
  rating: string | null;
  benchmark: string | null;
  nav_updated_at: string | null;
  return_30d: number | null;
  return_90d: number | null;
  return_180d: number | null;
  return_365d: number | null;
  return_2y: number | null;
  return_3y: number | null;
}

export interface NAVHistory {
  id: number;
  fund_id: number;
  date: string;
  nav: number;
}

// ─── Analytics ────────────────────────────────────────────────

export interface PortfolioReturns {
  total_invested: number;
  current_value: number;
  absolute_gain: number;
  return_pct: number;
  xirr: number | null;
}

export interface AllocationDrift {
  asset_type: string;
  current_pct: number;
  target_pct: number | null;
  drift_pct: number | null;
  current_value: number;
}

// ─── Snapshot ─────────────────────────────────────────────────

export interface Snapshot {
  id: number;
  portfolio_id: number;
  month: string;
  snapshot_date: string;
  total_invested: number;
  portfolio_value: number;
  absolute_gain: number;
  portfolio_xirr: number | null;
  equity_pct: number | null;
  debt_pct: number | null;
  money_market_pct: number | null;
  savings_pct: number | null;
  monthly_return_pct: number | null;
}

// ─── Daily Value ─────────────────────────────────────────────

export interface DailyValue {
  date: string;
  total_invested: number;
  portfolio_value: number;
}

// ─── Target Allocation ───────────────────────────────────────

export interface TargetAllocation {
  id: number;
  portfolio_id: number;
  asset_type: string;
  target_pct: number;
  current_value?: number | null;
  current_pct?: number | null;
  drift_pct?: number | null;
}

export interface TargetAllocationSet {
  asset_type: string;
  target_pct: number;
}

// ─── FI ───────────────────────────────────────────────────────

export interface FIProfile {
  id: number;
  user_id: number;
  monthly_expenses: number;
  fi_number: number | null;
  target_fi_date: string | null;
  safe_withdrawal_rate: number;
  inflation_rate: number;
  expected_return_rate: number;
  fi_strategy: string;
  barista_monthly_income: number | null;
}

export interface FIProfileUpdate {
  monthly_expenses?: number;
  target_fi_date?: string;
  safe_withdrawal_rate?: number;
  inflation_rate?: number;
  expected_return_rate?: number;
  fi_strategy?: string;
  barista_monthly_income?: number | null;
}

export interface FIDashboard {
  fi_number: number | null;
  net_worth: number | null;
  fi_progress_pct: number | null;
  savings_amount: number;
  savings_rate: number;
  projected_fi_date: string | null;
  years_to_fi: number | null;
  coast_fi_number: number | null;
  coast_fi_progress_pct: number | null;
  barista_fi_number: number | null;
  barista_fi_progress_pct: number | null;
  barista_monthly_income: number | null;
}

export interface NetWorthSnapshot {
  id: number;
  user_id: number;
  month: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

// ─── Income / Expense ─────────────────────────────────────────

export interface Income {
  id: number;
  user_id: number;
  month: string;
  source: string;
  amount: number;
  is_passive: boolean;
  notes: string | null;
}

export interface IncomeCreate {
  month: string;
  source: string;
  amount: number;
  is_passive?: boolean;
  notes?: string;
}

export interface Expense {
  id: number;
  user_id: number;
  month: string;
  category: string;
  amount: number;
  is_essential: boolean;
  notes: string | null;
}

export interface ExpenseCreate {
  month: string;
  category: string;
  amount: number;
  is_essential?: boolean;
  notes?: string;
}

export interface ExpenseSummary {
  total: number;
  by_category: {
    category: string;
    total: number;
    essential: number;
    discretionary: number;
  }[];
}

// ─── Alert ────────────────────────────────────────────────────

export interface AlertRule {
  id: number;
  user_id: number;
  fund_id: number | null;
  alert_type: string;
  threshold: number;
  is_active: boolean;
  last_triggered_at: string | null;
}

// ─── Rebalance ───────────────────────────────────────────────

export interface RebalanceRequest {
  amount: number;
}

export interface RebalanceSuggestion {
  asset_type: string;
  suggested_amount: number;
  current_pct: number;
  target_pct: number;
  drift_pct: number;
  recommended_fund_id: number | null;
  recommended_fund_name: string | null;
  reasoning: string | null;
}

// ─── Risk Score ─────────────────────────────────────────────

export interface ConcentrationWarning {
  entity: string;
  entity_type: string;
  weight_pct: number;
  threshold_pct: number;
  message: string;
}

export interface RiskScore {
  health_score: number;
  diversification_grade: string;
  concentration_warnings: ConcentrationWarning[];
  age_appropriate: boolean | null;
  age_appropriate_message: string | null;
  risk_factors: string[];
}

// ─── AI Insights ────────────────────────────────────────────

export interface AIInsight {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  market_context: string | null;
  rebalance_reasoning: Record<string, string>;
}

// ─── Emergency Fund ──────────────────────────────────────────

export interface EmergencyFundConfig {
  id: number;
  user_id: number;
  target_months: number;
}

export interface EmergencyFundConfigUpdate {
  target_months: number;
}

export interface EmergencyFundTag {
  id: number;
  user_id: number;
  holding_id: number | null;
  manual_asset_id: number | null;
  name: string | null;
  current_value: number | null;
}

export interface EmergencyFundTagCreate {
  holding_id?: number;
  manual_asset_id?: number;
}

export interface EmergencyFundTaggableItem {
  type: "holding" | "manual_asset";
  holding_id: number | null;
  manual_asset_id: number | null;
  name: string;
  asset_type: string;
  current_value: number;
  is_tagged: boolean;
  tag_id: number | null;
}

export interface EmergencyFundMilestone {
  months: number;
  target: number;
  reached: boolean;
}

export interface EmergencyFundDashboard {
  target_months: number;
  monthly_essential: number;
  target_amount: number;
  current_balance: number;
  progress_pct: number;
  months_covered: number;
  gap: number;
  status: "critical" | "building" | "healthy" | "strong";
  milestones: EmergencyFundMilestone[];
}
