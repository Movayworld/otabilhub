'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  quantity: number
  imageUrl: string | null
  imageAlt: string | null
  maxAvailable: number
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_STORAGE_KEY = 'otabilhub-cart'

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function setStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore write errors
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(getStoredCart())
  }, [])

  useEffect(() => {
    setStoredCart(items)
  }, [items])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.productId === item.productId
      )
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: Math.min(
                  i.quantity + item.quantity,
                  i.maxAvailable
                ),
              }
            : i
        )
      }
      return [...prev, { ...item, id: crypto.randomUUID() }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(1, Math.min(quantity, item.maxAvailable)),
              }
            : item
        )
      )
    },
    []
  )

  const increment = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id && item.quantity < item.maxAvailable
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    },
    []
  )

  const decrement = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      )
    },
    []
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      increment,
      decrement,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQuantity, increment, decrement, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
