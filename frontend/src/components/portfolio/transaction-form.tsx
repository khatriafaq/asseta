"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { FundSearchCombobox } from "./fund-search-combobox";
import type { FundBrief, Transaction } from "@/lib/types";

const fundSchema = z.object(
  {
    id: z.number(),
    name: z.string(),
    scheme_key: z.string(),
    fund_type: z.string(),
    current_nav: z.number().nullable(),
    return_ytd: z.number().nullable(),
    is_shariah_compliant: z.boolean(),
  },
  { message: "Please select a fund" }
);

const baseFields = {
  date: z.string().min(1, "Date is required"),
  transaction_type: z.enum(["Deposit", "Withdrawal", "Profit", "Dividend"]),
  amount: z.number().positive("Must be > 0"),
  units: z.number().min(0),
  price_per_unit: z.number().min(0),
};

const createSchema = z
  .object({ fund: fundSchema, ...baseFields })
  .refine((d) => d.transaction_type === "Profit" || d.units > 0, {
    message: "Must be > 0", path: ["units"],
  })
  .refine((d) => d.transaction_type === "Profit" || d.price_per_unit > 0, {
    message: "Must be > 0", path: ["price_per_unit"],
  });

const editSchema = z
  .object({ fund: z.any().optional(), ...baseFields })
  .refine((d) => d.transaction_type === "Profit" || d.units > 0, {
    message: "Must be > 0", path: ["units"],
  })
  .refine((d) => d.transaction_type === "Profit" || d.price_per_unit > 0, {
    message: "Must be > 0", path: ["price_per_unit"],
  });

type FormValues = z.infer<typeof createSchema>;

export interface TransactionFormData {
  fund_id: number;
  date: string;
  transaction_type: string;
  units: number;
  price_per_unit: number;
  amount: number;
}

interface TransactionFormProps {
  editTransaction?: Transaction & { fund_name?: string; fund_type?: string };
  editFund?: FundBrief | null;
  onSubmit: (data: TransactionFormData) => void;
  isPending: boolean;
}

type AutoField = "amount" | "units" | "price_per_unit";

export function TransactionForm({
  editTransaction,
  editFund,
  onSubmit,
  isPending,
}: TransactionFormProps) {
  const isEdit = !!editTransaction;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: editTransaction
      ? {
          fund: editFund ?? undefined,
          date: editTransaction.date.slice(0, 10),
          transaction_type: editTransaction.transaction_type as FormValues["transaction_type"],
          amount: Number(editTransaction.amount),
          units: Number(editTransaction.units),
          price_per_unit: Number(editTransaction.price_per_unit),
        }
      : {
          transaction_type: "Deposit",
          date: new Date().toISOString().slice(0, 10),
        },
  });

  const transactionType = watch("transaction_type");
  const isProfit = transactionType === "Profit";

  // When switching to Profit, zero out units/price; when switching away, clear them
  useEffect(() => {
    if (isProfit) {
      setValue("units", 0);
      setValue("price_per_unit", 0);
    }
  }, [isProfit, setValue]);

  // Auto-calculate: fill any 2 of {amount, units, price} → compute the 3rd
  const amount = watch("amount");
  const units = watch("units");
  const pricePerUnit = watch("price_per_unit");

  // Track which field the user last edited
  useEffect(() => {
    if (amount && units && !pricePerUnit) {
      const calc = amount / units;
      if (isFinite(calc) && calc > 0) setValue("price_per_unit", parseFloat(calc.toFixed(4)));
    } else if (amount && pricePerUnit && !units) {
      const calc = amount / pricePerUnit;
      if (isFinite(calc) && calc > 0) setValue("units", parseFloat(calc.toFixed(4)));
    } else if (units && pricePerUnit && !amount) {
      const calc = units * pricePerUnit;
      if (isFinite(calc) && calc > 0) setValue("amount", parseFloat(calc.toFixed(2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoCalc = (changed: AutoField) => {
    const a = changed === "amount" ? undefined : amount;
    const u = changed === "units" ? undefined : units;
    const p = changed === "price_per_unit" ? undefined : pricePerUnit;

    // We want the freshest values, so re-read from the form after setState
    setTimeout(() => {
      const vals = {
        amount: watch("amount"),
        units: watch("units"),
        price_per_unit: watch("price_per_unit"),
      };

      if (changed === "amount" && vals.amount && vals.units) {
        const calc = vals.amount / vals.units;
        if (isFinite(calc) && calc > 0) setValue("price_per_unit", parseFloat(calc.toFixed(4)));
      } else if (changed === "amount" && vals.amount && vals.price_per_unit) {
        const calc = vals.amount / vals.price_per_unit;
        if (isFinite(calc) && calc > 0) setValue("units", parseFloat(calc.toFixed(4)));
      } else if (changed === "units" && vals.units && vals.amount) {
        const calc = vals.amount / vals.units;
        if (isFinite(calc) && calc > 0) setValue("price_per_unit", parseFloat(calc.toFixed(4)));
      } else if (changed === "units" && vals.units && vals.price_per_unit) {
        const calc = vals.units * vals.price_per_unit;
        if (isFinite(calc) && calc > 0) setValue("amount", parseFloat(calc.toFixed(2)));
      } else if (changed === "price_per_unit" && vals.price_per_unit && vals.units) {
        const calc = vals.units * vals.price_per_unit;
        if (isFinite(calc) && calc > 0) setValue("amount", parseFloat(calc.toFixed(2)));
      } else if (changed === "price_per_unit" && vals.price_per_unit && vals.amount) {
        const calc = vals.amount / vals.price_per_unit;
        if (isFinite(calc) && calc > 0) setValue("units", parseFloat(calc.toFixed(4)));
      }
    }, 0);
  };

  const onFormSubmit = (data: FormValues) => {
    const isProfitTx = data.transaction_type === "Profit";
    onSubmit({
      fund_id: data.fund?.id ?? editTransaction?.fund_id ?? 0,
      date: data.date,
      transaction_type: data.transaction_type,
      units: isProfitTx ? 0 : data.units,
      price_per_unit: isProfitTx ? 0 : data.price_per_unit,
      amount: data.amount,
    });
  };

  const txTypes = ["Deposit", "Withdrawal", "Profit", "Dividend"] as const;
  const txColors: Record<string, string> = {
    Deposit: "var(--jade)",
    Withdrawal: "var(--coral)",
    Profit: "var(--sky)",
    Dividend: "var(--amber)",
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Fund selector */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Fund
        </label>
        <Controller
          name="fund"
          control={control}
          render={({ field }) => (
            <FundSearchCombobox
              value={field.value as FundBrief | null}
              onChange={field.onChange}
              disabled={isEdit}
            />
          )}
        />
        {errors.fund && (
          <p className="text-[var(--coral)] text-xs mt-1">{errors.fund.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Date
        </label>
        <input
          type="date"
          {...register("date")}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            colorScheme: "dark",
          }}
        />
        {errors.date && (
          <p className="text-[var(--coral)] text-xs mt-1">{errors.date.message}</p>
        )}
      </div>

      {/* Transaction type button group */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Type
        </label>
        <Controller
          name="transaction_type"
          control={control}
          render={({ field }) => (
            <div className="flex rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              {txTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className="flex-1 px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background:
                      field.value === t
                        ? `${txColors[t]}15`
                        : "transparent",
                    color:
                      field.value === t
                        ? txColors[t]
                        : "var(--text-muted)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Amount, Units, Price/Unit */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Amount (PKR)
          </label>
          <input
            type="number"
            step="any"
            {...register("amount", {
              valueAsNumber: true,
              onChange: () => handleAutoCalc("amount"),
            })}
            placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-xl text-sm font-mono-nums outline-none transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          />
          {errors.amount && (
            <p className="text-[var(--coral)] text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>
        {!isProfit && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Units
              </label>
              <input
                type="number"
                step="any"
                {...register("units", {
                  valueAsNumber: true,
                  onChange: () => handleAutoCalc("units"),
                })}
                placeholder="0.0000"
                className="w-full px-3 py-2.5 rounded-xl text-sm font-mono-nums outline-none transition-colors"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              />
              {errors.units && (
                <p className="text-[var(--coral)] text-xs mt-1">{errors.units.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Price / Unit
              </label>
              <input
                type="number"
                step="any"
                {...register("price_per_unit", {
                  valueAsNumber: true,
                  onChange: () => handleAutoCalc("price_per_unit"),
                })}
                placeholder="0.0000"
                className="w-full px-3 py-2.5 rounded-xl text-sm font-mono-nums outline-none transition-colors"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              />
              {errors.price_per_unit && (
                <p className="text-[var(--coral)] text-xs mt-1">{errors.price_per_unit.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[var(--text-muted)]">
        {isProfit
          ? "Profit on deposit — only amount is needed. Does not add to Total Invested."
          : "Fill any two of amount, units, or price — the third will be calculated automatically."}
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        style={{
          background: "var(--jade)",
          color: "var(--bg-deep)",
        }}
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? "Update Transaction" : "Add Transaction"}
      </button>
    </form>
  );
}
