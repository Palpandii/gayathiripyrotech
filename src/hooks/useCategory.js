import { useMemo } from 'react'
import { useProducts } from './useProducts.js'

function normalizeSlug(value) {
  if (value == null) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
}

export function useCategory(categoryId, searchTerm = '') {
  const { products, loading, error } = useProducts()

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const catSlug = normalizeSlug(categoryId) || 'all'

    return products.filter((p) => {
      const productSlug = normalizeSlug(p.category)
      const matchesCategory = catSlug === 'all' || productSlug === catSlug
      const matchesSearch =
        !term ||
        p.name_en.toLowerCase().includes(term) ||
        (p.name_ta || '').toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [products, categoryId, searchTerm])

  return { results, loading, error }
}