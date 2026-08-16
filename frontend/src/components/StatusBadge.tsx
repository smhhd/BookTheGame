import { statusLabel } from "../utils/format";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{statusLabel[status] ?? status}</span>;
}
