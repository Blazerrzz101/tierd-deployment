import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Product } from "@/types/product"

interface WishlistStore {
  items: Product[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (product) => {
        const currentItems = get().items
        const existingItem = currentItems.find(item => item.id === product.id)

        if (!existingItem) {
          set({ items: [...currentItems, product] })
        }
      },
      removeFromWishlist: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) })
      },
      isInWishlist: (productId) => {
        return get().items.some(item => item.id === productId)
      },
      clearWishlist: () => set({ items: [] })
    }),
    {
      name: "wishlist",
      skipHydration: true
    }
  )
) 