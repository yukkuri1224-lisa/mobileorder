"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, appUser, signOut } = useAuth();
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark">丼</span>
          <span>学食オーダー</span>
        </Link>
        <div className="header-actions">
          {appUser?.role === "admin" || appUser?.role === "staff" ? (
            <Link href="/admin" className="btn btn-ghost">
              調理ボード
            </Link>
          ) : null}
          <Link href="/order" className="btn btn-ghost">
            注文履歴
          </Link>
          {user ? (
            <button className="btn" onClick={() => signOut()}>
              ログアウト
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary">
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
