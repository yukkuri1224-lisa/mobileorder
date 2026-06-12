import type { OrderStatus } from "@/types";

const LABEL: Record<OrderStatus, string> = {
  pending: "決済待ち",
  paid: "受付済み",
  preparing: "調理中",
  ready: "受け取り可能",
  completed: "受け渡し済み",
  canceled: "キャンセル",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span className="dot" />
      {LABEL[status]}
    </span>
  );
}
