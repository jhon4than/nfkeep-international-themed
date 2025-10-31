import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { useCallback } from "react";

type InvoiceWarrantyBadgeProps = {
  daysToExpire: number;
};

enum WarningLevel {
  GOOD = "good",
  ATTENTION = "attention",
  CRITICAL = "critical",
  EXPIRED = "expired",
}

const badgeVariants = cva("mx-auto py-2 px-3 rounded-full font-bold", {
  variants: {
    variant: {
      [WarningLevel.GOOD]: "text-white bg-emerald-600",
      [WarningLevel.ATTENTION]: "text-white bg-amber-600",
      [WarningLevel.CRITICAL]: "text-white bg-rose-700",
      [WarningLevel.EXPIRED]: "text-white bg-slate-950",
    },
  },
  defaultVariants: {
    variant: WarningLevel.GOOD,
  },
});

export function InvoiceWarrantyBadge({
  daysToExpire,
}: InvoiceWarrantyBadgeProps) {
  const { t } = useI18n();

  const getVariant = useCallback(() => {
    if (daysToExpire <= 0) return WarningLevel.EXPIRED;
    if (daysToExpire <= 30) return WarningLevel.CRITICAL;
    if (daysToExpire <= 60) return WarningLevel.ATTENTION;
    return WarningLevel.GOOD;
  }, [daysToExpire]);

  return (
    <span className={cn(badgeVariants({ variant: getVariant() }))}>
      {daysToExpire > 0 ? `${daysToExpire} ${t("invoices.daysToExpire")}` : t("invoices.expired")}
    </span>
  );
}
