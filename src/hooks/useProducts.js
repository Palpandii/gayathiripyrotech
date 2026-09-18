import { useEffect, useState } from 'react'
import { fetchProducts } from '../data/api.js'

export function useProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchProducts()
            .then((data) => {
                if (!cancelled) setProducts(data)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    return { products, loading, error }
}