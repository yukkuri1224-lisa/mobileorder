# 学食オーダー（ウェブ決済アプリ）

並ばずに注文・事前決済でき、調理側はリアルタイムで注文を受け取れる学食アプリです。

- フロント: Next.js (TypeScript) + PWA
- 認証: Firebase Authentication（Googleログイン）
- DB: Cloud Firestore（リアルタイム）
- 決済: Stripe Checkout
- デプロイ: Vercel
- **ラズベリーパイ不要・固定費ゼロ**（Stripeの決済手数料のみ）

---

## 全体像

```
学生 → メニュー閲覧・注文 → Stripeで決済
   → Webhookで注文を「受付済み」に → 調理ボードに即表示（通知音）
   → スタッフが調理中/できあがりを更新 → 学生の画面にリアルタイム反映
```

LINE Notifyは2025年に終了したため、**スタッフ用「調理ボード」のリアルタイム表示＋通知音**で注文アラートを代替しています。

---

## あなたがやること（順番にこのとおり進めれば動きます）

### 0. 必要なアカウント（すべて無料で開始可）
- [ ] GitHub アカウント
- [ ] Google / Firebase アカウント
- [ ] Stripe アカウント
- [ ] Vercel アカウント
- [ ] PCに Node.js 20以上 をインストール

---

### 1. Firebase プロジェクトを作る
1. https://console.firebase.google.com/ で「プロジェクトを追加」
2. 左メニュー **Authentication → ログイン方法 → Google を有効化**
3. **Firestore Database → データベースを作成**（本番モードでOK）
4. **プロジェクトの設定（⚙️）→ 全般 → マイアプリ → ウェブアプリを追加**
   - 表示される `firebaseConfig` の値を控える（手順5で使う）
5. **プロジェクトの設定 → サービスアカウント → 新しい秘密鍵を生成**
   - JSONがダウンロードされる（手順5で使う・絶対に公開しない）

---

### 2. Stripe を準備
1. https://dashboard.stripe.com/ にログイン
2. まずは右上が「テストモード」のまま進める
3. **開発者 → APIキー** から
   - 公開可能キー（`pk_test_...`）
   - シークレットキー（`sk_test_...`）
   をコピー
4. Webhookは手順6（デプロイ後）で設定します

---

### 3. コードをローカルに置く
このフォルダ一式を自分のPCに置き、ターミナルで開いて:

```bash
npm install
```

---

### 4. 環境変数ファイルを作る
`.env.example` をコピーして `.env.local` を作り、値を埋める:

```bash
cp .env.example .env.local
```

| 変数 | 入れる値 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | 手順1-4の firebaseConfig の各値 |
| `FIREBASE_ADMIN_PROJECT_ID` | サービスアカウントJSONの `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | 同 `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 同 `private_key`（`-----BEGIN...` から `...END-----\n` まで丸ごと、ダブルクォートで囲む） |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | 手順6で取得（最初は空でOK） |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` |

---

### 5. メニューを投入してローカルで動かす
```bash
npm run seed   # サンプルメニュー10品をFirestoreに登録
npm run dev    # http://localhost:3000 で確認
```

Stripeのテスト決済はカード番号 `4242 4242 4242 4242`／有効期限は未来の日付／CVCは任意 で通ります。

---

### 6. Vercel にデプロイ
1. このフォルダを GitHub リポジトリにpush
2. https://vercel.com/ で「New Project」→ そのリポジトリを選択
3. **Environment Variables** に `.env.local` の中身をすべて登録
   - ただし `NEXT_PUBLIC_BASE_URL` は本番URL（例 `https://xxx.vercel.app`）に変更
4. Deploy

#### デプロイ後にStripe Webhookを設定
1. Stripeダッシュボード **開発者 → Webhook → エンドポイントを追加**
2. URL: `https://あなたのドメイン/api/webhook`
3. 受信イベント: `checkout.session.completed` と `checkout.session.expired`
4. 表示される **署名シークレット（`whsec_...`）** を、Vercelの環境変数 `STRIPE_WEBHOOK_SECRET` に登録して再デプロイ

---

### 7. Firestoreのルールとインデックスを反映
**重要（これをやらないと注文一覧が表示されません）**

方法A: Firebase CLI を使う
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

方法B: コンソールで手動
- ルール: `firestore.rules` の中身を Firestore → ルール に貼り付けて公開
- インデックス: 初回に一覧が出ないとき、ブラウザのコンソールに表示される「インデックス作成リンク」を押すだけでもOK

---

### 8. スタッフ（調理ボードを使う人）を登録
調理ボード `/admin` はスタッフ権限が必要です。
1. そのスタッフに一度アプリでGoogleログインしてもらう（`users` に自動登録される）
2. Firestoreコンソールで該当ユーザーの `role` を `student` → `staff`（または `admin`）に変更
3. `/admin` が使えるようになります

---

### 9. 本番受付開始（テスト→本番への切替）
- Stripeを「本番モード」に切り替え、本番APIキー（`pk_live_` / `sk_live_`）に差し替え
- 本番のWebhookも作り直して `whsec_` を更新
- Stripeの本人確認（事業者情報の登録）を済ませる

---

## このアプリに含まれない / 別途検討すること

| 元の構成 | このアプリでの扱い |
|---|---|
| 熱転写プリンター（ESC/POS） | **除外**。調理ボードの画面表示で代替。紙が必要なら、ボードに「印刷ボタン」を足してブラウザ印刷するのが最も簡単 |
| Google Sheets バックアップ（GAS） | 任意。やるなら、Firestoreを日次でSheetsに書き出すGASを別途設置（無料） |
| PayPay | Stripe Checkoutに集約。Stripe経由でコンビニ決済等を足すことは可能 |

---

## ディレクトリ構成
```
cafeteria-order/
├── src/
│   ├── app/
│   │   ├── page.tsx            # メニュー＋カート（注文の起点）
│   │   ├── login/              # Googleログイン
│   │   ├── order/              # 注文履歴（リアルタイム）
│   │   ├── admin/              # 調理ボード（スタッフ専用）
│   │   ├── success/ cancel/    # 決済後の画面
│   │   └── api/
│   │       ├── checkout/       # Stripe Checkoutセッション作成
│   │       ├── webhook/        # 決済確定 → 注文をpaidに
│   │       └── orders/         # スタッフによるステータス更新
│   ├── components/             # Header, StatusBadge
│   ├── hooks/                  # useAuth, useCart
│   ├── lib/                    # firebase, firebase-admin, stripe
│   └── types/
├── scripts/seed.ts            # 初期メニュー投入
├── firestore.rules            # セキュリティルール
└── firestore.indexes.json     # 複合インデックス
```

## 料金の目安
- Firebase / Vercel: 学食規模なら無料枠内に収まる想定
- Stripe: 1決済あたり手数料（日本のカード決済はおおむね3.6%前後）。固定の月額はなし
