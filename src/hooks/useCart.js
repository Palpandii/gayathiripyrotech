import { useCartContext } from '../context/CartContext.jsx'

// Thin wrapper so components import `useCart` from hooks/ per project convention,
// while the actual state lives in CartContext.
export function useCart() {
  return useCartContext()
}
