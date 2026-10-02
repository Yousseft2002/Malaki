import { formatMoney } from "@/lib/domain/money";
import { STORE_CURRENCY, STORE_LOCALE } from "@/lib/store-config";

export function Price({ cents, prefix, className = "" }: { cents: number | null; prefix?: string; className?: string }) {
  return (
    <span className={className}>
      {prefix && cents !== null ? `${prefix} ` : ""}
      {formatMoney(cents, STORE_CURRENCY, STORE_LOCALE)}
    </span>
  );
}

export const money = (cents: number | null) => formatMoney(cents, STORE_CURRENCY, STORE_LOCALE);
