"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import type { Order, OrderStatus } from "@/types";
import Link from "next/link";

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  paid: { label: "調理開始", to: "preparing" },
  preparing: { label: "できあがり", to: "ready" },
  ready: { label: "受け渡し完了", to: "completed" },
};

export default function AdminPage() {
  const { user, appUser, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const prevCount = useRef(0);

  const isStaff = appUser?.role === "admin" || appUser?.role === "staff";

  useEffect(() => {
    if (!isStaff) return;
    // 進行中の注文のみ（paid/preparing/ready）
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["paid", "preparing", "ready"]),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as Order);
      // 新着が増えたら通知音
      if (list.length > prevCount.current && prevCount.current !== 0) {
        beep();
      }
      prevCount.current = list.length;
      setOrders(list);
    });
  }, [isStaff]);

  async function update(orderId: string, status: OrderStatus) {
    const token = await auth.currentUser!.getIdToken();
    await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId, status }),
    });
  }

  if (!loading && !isStaff) {
    return (
      <>
        <Header />
        <main className="container center">
          <div>
            <p className="muted" style={{ marginBottom: 16 }}>
              この画面はスタッフ専用です。
            </p>
            <Link href="/" className="btn btn-primary">
              メニューに戻る
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20 }}>
        <p className="eyebrow">スタッフ</p>
        <h1 className="h1">調理ボード</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          決済が完了した注文がここに自動で表示されます（新着は通知音でお知らせ）。
        </p>

        {orders.length === 0 ? (
          <div className="empty">進行中の注文はありません。</div>
        ) : (
          <div className="tickets">
            {orders.map((o) => {
              const action = NEXT_ACTION[o.status];
              return (
                <div className={`ticket ${o.status}`} key={o.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="ticket-num">No.{o.orderNumber}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", margin: "10px 0" }}>
                    {o.lines.map((l, i) => (
                      <li key={i} style={{ padding: "2px 0" }}>
                        {l.name} <b>×{l.quantity}</b>
                      </li>
                    ))}
                  </ul>
                  {o.note && (
                    <p className="muted" style={{ fontSize: 13 }}>
                      備考: {o.note}
                    </p>
                  )}
                  {action && (
                    <button
                      className="btn btn-primary btn-block"
                      style={{ marginTop: 8 }}
                      onClick={() => update(o.id, action.to)}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* 通知音が鳴らせない環境では無視 */
  }
}
