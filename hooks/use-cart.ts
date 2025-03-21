import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Product } from "@/types/product"

interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) => {
        const currentItems = get().items
        const existingItem = currentItems.find(item => item.id === product.id)

        if (existingItem) {
          set({
            items: currentItems.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] })
        }
      },
      removeFromCart: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map(item =>
            item.id === productId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ).filter(item => item.quantity > 0)
        })
      },
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce(
          (sum, item) => sum + (item.price ?? 0) * item.quantity,
          0
        )
      }
    }),
    {
      name: "shopping-cart",
      skipHydration: true
    }
  )
) 