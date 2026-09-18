import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCategory } from '../hooks/useCategory.js'
import { useCategories } from '../hooks/useCategories.js'
import './Products.css'

export default function Products() {
  const { t, pickField, tBoth } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'all'
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const { results, loading, error } = useCategory(activeCategory, search)
  const { categories, loading: categoriesLoading } = useCategories()

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'all') next.delete('category')
    else next.set('category', id)
    setSearchParams(next)
  }

  const activeLabel = useMemo(() => {
    if (activeCategory === 'all') return tBoth('products.filterAll').en
    const cat = categories.find((c) => c.id === activeCategory)
    if (!cat) return tBoth('products.filterAll').en
    return pickField(cat, 'name')
  }, [activeCategory, tBoth, pickField, categories])

  return (
    <div className="page-shell">
      <div className="page-banner">
        <div className="container">
          <span className="crumb">{t('nav.home')} / <b>{t('nav.products')}</b></span>
          <h1>{t('products.title')}</h1>
          <p>{t('products.sub')}</p>
        </div>
      </div>

      <div className="container">
        <div className="cat-rail-wrap">
          <div className="cat-rail-scroll">
            <button
              className={`cat-pill${activeCategory === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              <span className="cat-pill-icon">🎇</span>
              <span>{tBoth('products.filterAll').en}</span>
            </button>
            {categoriesLoading ? (
              <p>Loading…</p>
            ) : (
              categories.map((c) => {
                const name = pickField(c, 'name')
                return (
                  <button
                    key={c.id}
                    className={`cat-pill${activeCategory === c.id ? ' active' : ''}`}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.image ? (
                      <img src={c.image} alt={name} className="cat-pill-img" />
                    ) : (
                      <span className="cat-pill-icon">🎆</span>
                    )}
                    <span>{name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="products-meta">
          <span>{t('products.showing')} <b>{results.length}</b> {t('products.items')} — {activeLabel}</span>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {results.length === 0 ? (
          <div className="empty-state">{t('products.empty')}</div>
        ) : (
          <div className="product-grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}