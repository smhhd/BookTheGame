export function Loading({ label = "در حال دریافت اطلاعات…" }: { label?: string }) {
  return <div className="state-box" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state-box error" role="alert"><strong>مشکلی پیش آمد</strong><span>{message}</span>{retry && <button onClick={retry}>تلاش دوباره</button>}</div>;
}

export function EmptyState({ message = "موردی پیدا نشد." }: { message?: string }) {
  return <div className="state-box empty"><span className="empty-icon">○</span>{message}</div>;
}
