import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '../types/product'

interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product: Product, quantity: number) => 
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            }
          } else {
            return { items: [...state.items, { product, quantity }] }
          }
        }),
      removeItem: (productId: string) => 
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        })),
      updateQuantity: (productId: string, quantity: number) => 
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        })),
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      itemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
)
