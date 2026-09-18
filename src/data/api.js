const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function normalizeProduct(p) {
    return {
        id: p.id,
        category: p.category,
        name_en: p.nameEn ?? p.name_en ?? '',
        name_ta: p.nameTa ?? p.name_ta ?? '',
        qty_unit: p.qtyUnit ?? p.qty_unit ?? '',
        mrp: p.mrp,
        price: p.price,
        image: p.image || '',
        youtube_id: p.youtubeId ?? p.youtube_id ?? '',
    }
}

function normalizeCategory(c) {
    return {
        id: c.id,
        name_en: c.nameEn ?? c.name_en ?? '',
        name_ta: c.nameTa ?? c.name_ta ?? '',
        image: c.image || '',
    }
}

let productsCache = null
let productsInFlight = null

export async function fetchProducts() {
    if (productsCache) return productsCache
    if (!productsInFlight) {
        productsInFlight = fetch(`${API_BASE}/api/products`)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load products (${res.status})`)
                return res.json()
            })
            .then((data) => {
                productsCache = data.map(normalizeProduct)
                return productsCache
            })
            .finally(() => {
                productsInFlight = null
            })
    }
    return productsInFlight
}

let categoriesCache = null
let categoriesInFlight = null

export async function fetchCategories() {
    if (categoriesCache) return categoriesCache
    if (!categoriesInFlight) {
        categoriesInFlight = fetch(`${API_BASE}/api/categories`)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load categories (${res.status})`)
                return res.json()
            })
            .then((data) => {
                categoriesCache = data.map(normalizeCategory)
                return categoriesCache
            })
            .finally(() => {
                categoriesInFlight = null
            })
    }
    return categoriesInFlight
}

export function clearCatalogCache() {
    productsCache = null
    categoriesCache = null
}

export { API_BASE }