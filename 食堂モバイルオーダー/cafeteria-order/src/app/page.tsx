"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import type { MenuItem } from "@/types";
import { useRouter } from "next/navigation";

const EMOJI: Record<string, string> = {
  定食: "🍱",
  麺類: "🍜",
  丼物: "🍚",
  カレー: "🍛",
  サイド: "🥗",
  ドリンク: "🥤",
};

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const cart = useCart();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "menu"), orderBy("category"));
      const snap = await getDocs(q);
      setMenu(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem))
      );
      setLoading(false);
    })();
  }, []);

  const categories = [...new Set(menu.map((m) => m.category))];

  async function checkout() {
    if (!user) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cart.items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "エラーが発生しました");
        setSubmitting(false);
      }
    } catch {
      alert("通信エラーが発生しました");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20 }}>
        <p className="eyebrow">本日のメニュー</p>
        <h1 className="h1">何にする？</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          注文して事前決済すれば、列に並ばず受け取れます。
        </p>

        {loading ? (
          <p className="muted">読み込み中…</p>
        ) : menu.length === 0 ? (
          <div className="empty">メニューがまだ登録されていません。</div>
        ) : (
          categories.map((cat) => (
            <section key={cat} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>{cat}</h2>
              <div className="grid">
                {menu
                  .filter((m) => m.category === cat)
                  .map((item) => {
                    const inCart = cart.items.find(
                      (i) => i.menuItem.id === item.id
                    );
                    const disabled = !item.available || item.soldOut;
                    return (
                      <div className="card" key={item.id}>
                        <div className="card-img">
                          {EMOJI[item.category] ?? "🍽️"}
                        </div>
                        <div className="card-body">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <span className="card-name">{item.name}</span>
                            {disabled && (
                              <span className="badge badge-soldout">
                                売り切れ
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="card-desc">{item.description}</p>
                          )}
                          <div className="card-foot">
                            <span className="price">
                              {item.price.toLocaleString()}
                              <span className="price-yen">円</span>
                            </span>
                            {inCart ? (
                              <div className="stepper">
                                <button
                                  onClick={() =>
                                    cart.setQty(item.id, inCart.quantity - 1)
                                  }
                                >
                                  −
                                </button>
                                <span>{inCart.quantity}</span>
                                <button
                                  onClick={() =>
                                    cart.setQty(item.id, inCart.quantity + 1)
                                  }
                                >
                                  ＋
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn btn-primary"
                                disabled={disabled}
                                onClick={() => cart.add(item)}
                              >
                                追加
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ))
        )}
        <div className="spacer-bottom" />
      </main>

      {cart.count() > 0 && (
        <div className="cartbar">
          <div className="cartbar-inner">
            <div>
              <div style={{ fontWeight: 700 }}>
                {cart.count()}点 / {cart.total().toLocaleString()}円
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: "2px 0", fontSize: 13 }}
                onClick={() => cart.clear()}
              >
                カートを空にする
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={checkout}
              disabled={submitting}
            >
              {submitting ? "処理中…" : "決済へ進む"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
