import { useEffect, useState } from 'react'
import { fetchCategories } from '../data/api.js'

export function useCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchCategories()
            .then((data) => {
                if (!cancelled) setCategories(data)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    return { categories, loading, error }
}