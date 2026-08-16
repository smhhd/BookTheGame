export const formatPrice = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : `${new Intl.NumberFormat("fa-IR").format(Number(value))} تومان`;

export const formatDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export const statusLabel: Record<string, string> = {
  available: "موجود", reserved: "رزرو شده", sold: "فروخته شده", cancelled: "لغوشده",
  pending: "در انتظار", paid: "پرداخت‌شده", expired: "منقضی", success: "موفق",
  failed: "ناموفق", refunded: "بازپرداخت‌شده", reviewed: "بررسی‌شده", rejected: "ردشده"
};

export const friendlyError = (error: unknown) => {
  if (!(error instanceof Error)) return "خطای نامشخصی رخ داد.";
  const map: Record<string, string> = {
    "Failed to fetch": "ارتباط با سرور برقرار نشد.",
    "The operation was aborted due to timeout": "زمان پاسخ‌گویی سرور به پایان رسید."
  };
  return map[error.message] ?? error.message;
};
