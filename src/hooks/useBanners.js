import { useEffect, useState } from 'react'

// The hero banner slider is managed from Admin -> Banner and now lives in
// the backend (banners table) so it syncs across devices/browsers instead
// of being stuck in one admin's localStorage.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const EVENT_NAME = 'as-crackers-banners-updated'

// Ships with the original banner as slide 1 so the site never shows an
// empty hero before the admin has saved anything, or if the API call fails.
const DEFAULT_BANNERS = [
    { id: 'default-1', url: '/images/hero-banner.jpg' },
]

let cache = null

export async function fetchBanners() {
    try {
        const res = await fetch(`${API_BASE}/api/banners`)
        if (!res.ok) throw new Error(`Failed to load banners (${res.status})`)
        const data = await res.json()
        cache = Array.isArray(data) && data.length > 0 ? data : DEFAULT_BANNERS
        return cache
    } catch {
        // Backend unreachable or empty table — fall back so the hero still renders.
        return cache || DEFAULT_BANNERS
    }
}

export function notifyBannersUpdated(banners) {
    cache = banners
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: banners }))
}

export function useBanners() {
    const [banners, setBanners] = useState(cache || DEFAULT_BANNERS)

    useEffect(() => {
        let active = true
        fetchBanners().then((data) => {
            if (active) setBanners(data)
        })

        function onUpdate(e) {
            setBanners(e.detail && e.detail.length ? e.detail : DEFAULT_BANNERS)
        }
        window.addEventListener(EVENT_NAME, onUpdate)
        return () => {
            active = false
            window.removeEventListener(EVENT_NAME, onUpdate)
        }
    }, [])

    return banners
}

export const BANNER_LIMIT = 5
