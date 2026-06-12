export interface MenuItem {
  id: string;
  name: string;
  price: number; // 円（整数）
  category: string;
  description?: string;
  imageUrl?: string;
  available: boolean;
  soldOut?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus =
  | "pending" // 決済待ち
  | "paid" // 決済完了・調理待ち
  | "preparing" // 調理中
  | "ready" // 受け取り可能
  | "completed" // 受け渡し済み
  | "canceled";

export interface OrderLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: number; // 当日の通し番号
  userId: string;
  userEmail: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  stripeSessionId?: string;
  createdAt: number; // epoch ms
  paidAt?: number;
  note?: string;
}

export type UserRole = "student" | "staff" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
}
