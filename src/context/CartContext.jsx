import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('as_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('as_cart', JSON.stringify(items))
  }, [items])

  const setQty = (product, qty) => {
    setItems((prev) => {
      const clamped = Math.max(0, Math.floor(qty || 0))
      const existing = prev.find((i) => i.id === product.id)
      if (clamped === 0) {
        return prev.filter((i) => i.id !== product.id)
      }
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: clamped } : i))
      }
      return [...prev, { ...product, qty: clamped }]
    })
  }

  const increment = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const decrement = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (!existing) return prev
      if (existing.qty <= 1) return prev.filter((i) => i.id !== product.id)
      return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty - 1 } : i))
    })
  }

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clearCart = () => setItems([])
  const qtyOf = (id) => items.find((i) => i.id === id)?.qty || 0

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items])

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        setQty,
        increment,
        decrement,
        removeItem,
        clearCart,
        qtyOf,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}
