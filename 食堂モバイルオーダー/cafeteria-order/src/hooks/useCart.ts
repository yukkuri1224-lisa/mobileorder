import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MenuItem } from "@/types";

interface CartState {
  items: CartItem[];
  add: (item: MenuItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (menuItem) =>
        set((s) => {
          const found = s.items.find((i) => i.menuItem.id === menuItem.id);
          if (found) {
            return {
              items: s.items.map((i) =>
                i.menuItem.id === menuItem.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...s.items, { menuItem, quantity: 1 }] };
        }),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.menuItem.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.menuItem.id !== id)
              : s.items.map((i) =>
                  i.menuItem.id === id ? { ...i, quantity: qty } : i
                ),
        })),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce(
          (sum, i) => sum + i.menuItem.price * i.quantity,
          0
        ),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: "cafeteria-cart" }
  )
);
